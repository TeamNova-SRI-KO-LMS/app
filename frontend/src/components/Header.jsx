import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="app-header">
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </header>
  );
}
