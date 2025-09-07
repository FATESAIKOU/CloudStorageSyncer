import './DeleteConfirmModal.css';

function DeleteConfirmModal({ file, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>確認刪除</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="delete-warning">
            ⚠️ 您確定要刪除此{file.isDirectory ? '資料夾' : '檔案'}嗎？
          </div>

          <div className="file-info">
            <div className="file-icon">
              {file.isDirectory ? '📁' : '📄'}
            </div>
            <div className="file-name">
              {file.key.split('/').pop() || file.key}
            </div>
          </div>

          <div className="delete-note">
            {file.isDirectory
              ? '此操作將刪除資料夾及其所有內容，且無法復原。'
              : '此操作無法復原。'
            }
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            確認刪除
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
