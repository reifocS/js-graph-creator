import Modal from "react-modal";
import React from "react";
Modal.setAppElement("#root");

const EditModal = ({ isOpen, close, toEdit, handleSubmit }) => {
  return (
    <Modal s isOpen={isOpen} onRequestClose={close} contentLabel="Edit node">
      <form onSubmit={handleSubmit}>
        <button onClick={close}>close</button>
        <div>Change label</div>
        <input name="label" defaultValue={toEdit?.name ?? ""} />
        <button>Save</button>
      </form>
    </Modal>
  );
};

export default EditModal;
