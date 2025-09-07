import './LoadingSpinner.css';

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <div className="loading-text">{message}</div>
    </div>
  );
}

export default LoadingSpinner;
