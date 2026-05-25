import Footer from './Footer';
import Header from './Header';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
