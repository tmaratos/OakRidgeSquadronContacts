import './FloatingActionButton.css';

export default function FloatingActionButton({ onClick, label = 'Quick actions' }) {
  return (
    <button
      type="button"
      className="fab"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      +
    </button>
  );
}
