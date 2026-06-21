import './AppFooter.css';

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="app-footer-text">
        Built by{' '}
        <a
          href="https://tristanmaratos.com"
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer-link"
        >
          Tristan Maratos
        </a>
      </p>
    </footer>
  );
}
