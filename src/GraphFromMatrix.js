import Modal from "react-modal";
import React from "react";
Modal.setAppElement("#root");

const defaultState = [
  [0, 1, 0],
  [1, 0, 0],
  [0, 1, 0]
];
const GraphFromMatrix = ({ isOpen, close, handleSubmit }) => {
  const [matrix, setMatrix] = React.useState(defaultState);

  const addMoreNode = () => {
    setMatrix((prev) => {
      const n = prev.map((r) => [...r, 0]);
      const newRow = [];
      for (let i = 0; i < n.length + 1; ++i) {
        newRow.push(0);
      }
      n.push(newRow);
      return n;
    });
  };

  const reset = () => {
    setMatrix(defaultState);
  };
  return (
    <Modal isOpen={isOpen} onRequestClose={close} contentLabel="Edit node">
      <div className="button-close-modal">
        <button onClick={close}>X</button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(matrix);
        }}
        className="form-matrix"
      >
        {matrix.map((row, index) => {
          return (
            <div key={index}>
              {row.map((input, idx) => (
                <input
                  type="number"
                  key={idx}
                  onChange={(e) => {
                    const copyMat = [...matrix];
                    copyMat[index][idx] = parseInt(e.target.value, 10);
                    setMatrix(copyMat);
                  }}
                  value={input}
                />
              ))}
            </div>
          );
        })}
        <div>
          <button>Create</button>
        </div>
      </form>
      <button onClick={addMoreNode}>Add node</button>
      <button onClick={reset}>Reset</button>
    </Modal>
  );
};

export default GraphFromMatrix;
