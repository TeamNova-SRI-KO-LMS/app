const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const crypto = require('node:crypto');
const path = require('node:path');

const userModulePath = path.resolve(__dirname, '../models/User.js');
const emailModulePath = path.resolve(__dirname, '../services/emailService.js');
const authRoutesPath = path.resolve(__dirname, '../routes/authRoutes.js');
const originalUserModule = require.cache[userModulePath];
const originalEmailModule = require.cache[emailModulePath];
const users = new Map();
let deliveredOtp;
let authRouter;

const createUser = (email, password) => ({
  _id: { toString: () => email },
  email,
  name: email,
  password,
  isActive: true,
  resetPasswordToken: undefined,
  resetPasswordExpire: undefined,
  resetPasswordRequestToken: undefined,
  resetPasswordRequestExpire: undefined,
  resetPasswordVerified: false,
  async save() {
    users.set(this.email, this);
  },
});

const query = value => ({
  select: async () => value,
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
});

const fakeUserModel = {
  findOne: conditions => {
    if (conditions.email) {
      return query(users.get(conditions.email));
    }

    const user = [...users.values()].find(candidate =>
      candidate.resetPasswordRequestToken === conditions.resetPasswordRequestToken,
    );
    return query(user);
  },
  findOneAndUpdate: (conditions, update) => {
    const user = [...users.values()].find(candidate =>
      candidate._id.toString() === conditions._id.toString()
      && candidate.resetPasswordRequestToken === conditions.resetPasswordRequestToken
      && candidate.resetPasswordVerified === conditions.resetPasswordVerified,
    );

    if (user) {
      user.resetPasswordRequestToken = undefined;
      user.resetPasswordRequestExpire = undefined;
      user.resetPasswordVerified = update.$set.resetPasswordVerified;
    }

    return query(user);
  },
  findById: id => query(users.get(id.toString())),
};

const fakeEmailService = {
  sendPasswordResetOtp: async (user, otp) => {
    deliveredOtp = { recipient: user.email, otp };
  },
};

const response = () => {
  const result = { statusCode: 200, body: undefined };
  return {
    result,
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
};

const request = async (pathName, body) => {
  const layer = authRouter.stack.find(item => item.route?.path === pathName);
  assert.ok(layer, `route ${pathName} should exist`);
  const result = response();
  await layer.route.stack[0].handle({ body }, result);
  return result.result;
};

before(() => {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  users.set('testuser1@gmail.com', createUser('testuser1@gmail.com', 'user-a-old'));
  users.set('dewindimohottige25@gmail.com', createUser('dewindimohottige25@gmail.com', 'sender-old'));

  require.cache[userModulePath] = {
    id: userModulePath,
    filename: userModulePath,
    loaded: true,
    exports: fakeUserModel,
  };
  require.cache[emailModulePath] = {
    id: emailModulePath,
    filename: emailModulePath,
    loaded: true,
    exports: fakeEmailService,
  };
  authRouter = require(authRoutesPath);
});

after(() => {
  if (originalUserModule) require.cache[userModulePath] = originalUserModule;
  else delete require.cache[userModulePath];
  if (originalEmailModule) require.cache[emailModulePath] = originalEmailModule;
  else delete require.cache[emailModulePath];
  delete require.cache[authRoutesPath];
});

test('resets only the requested account and cannot reuse its OTP', async () => {
  const forgotResult = await request('/forgot-password', { email: 'testuser1@gmail.com' });
  assert.match(forgotResult.body.resetRequestToken, /^[a-f0-9]{64}$/);
  assert.equal(deliveredOtp.recipient, 'testuser1@gmail.com');
  const requestToken = forgotResult.body.resetRequestToken;
  assert.ok(requestToken);
  assert.equal(users.get('dewindimohottige25@gmail.com').password, 'sender-old');

  const verifyResult = await request('/verify-reset-otp', {
    resetRequestToken: requestToken,
    otp: deliveredOtp.otp,
  });
  assert.equal(verifyResult.statusCode, 200);

  const resetToken = verifyResult.body?.resetToken;
  const resetResult = await request('/reset-password', { resetToken, password: 'user-a-new' });
  assert.equal(resetResult.statusCode, 200);
  assert.equal(users.get('testuser1@gmail.com').password, 'user-a-new');
  assert.equal(users.get('dewindimohottige25@gmail.com').password, 'sender-old');

  const replayResult = await request('/reset-password', {
    resetToken,
    password: 'user-a-replay',
  });
  assert.equal(replayResult.statusCode, 401);
  assert.equal(users.get('testuser1@gmail.com').password, 'user-a-new');
});

test('different normalized recipient addresses remain separate reset accounts', async () => {
  users.set('testuser@gmail.com', createUser('testuser@gmail.com', 'user-b-old'));
  await request('/forgot-password', { email: ' TestUser@gmail.com ' });

  assert.equal(deliveredOtp.recipient, 'testuser@gmail.com');
  assert.equal(users.get('testuser1@gmail.com').password, 'user-a-new');
  assert.equal(users.get('testuser@gmail.com').password, 'user-b-old');
});

test('an invalid OTP does not verify a reset request', async () => {
  const forgotResult = await request('/forgot-password', { email: 'testuser1@gmail.com' });
  const user = users.get('testuser1@gmail.com');
  const requestToken = forgotResult.body.resetRequestToken;
  const verifyResult = await request('/verify-reset-otp', {
    resetRequestToken: requestToken,
    otp: '000000',
  });

  assert.equal(verifyResult.statusCode, 400);
  assert.equal(user.resetPasswordVerified, false);
});
