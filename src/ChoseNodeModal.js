import Modal from "react-modal";
import React from "react";
Modal.setAppElement("#root");

const ChoseNodeModal = ({ isOpen, close, handleSubmit, nodes }) => {
  const [node, setNode] = React.useState(nodes[0]);
  return (
    <Modal isOpen={isOpen} onRequestClose={close} contentLabel="Edit node">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(node);
          close();
        }}
      >
        <button onClick={close}>close</button>
        <div>Chose starting node</div>
        <select
          value={node.id}
          onChange={(e) => setNode(nodes.find((n) => n.id === e.target.value))}
        >
          {nodes.map((n) => (
            <option value={n.id} key={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <button>Start</button>
      </form>
    </Modal>
  );
};

export default ChoseNodeModal;
