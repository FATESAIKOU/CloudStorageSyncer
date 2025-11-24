import './ErrorMessage.css';

function ErrorMessage({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-message">
      <div className="error-content">
        <span className="error-text">{message}</span>
        {onClose && (
          <button className="error-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
