import React, { useState } from "react";

const PinEditor = ({ pin, onSave, onDelete, onClose }) => {
  const [color, setColor] = useState(pin.color);
  const [images, setImages] = useState(pin.images || []);

  const handleImageChange = (index, field, value) => {
    const updated = [...images];
    updated[index][field] = value;
    setImages(updated);
  };

  const handleAddImage = () => {
    setImages([...images, { url: "", text: "" }]);
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const handleImageFile = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleImageChange(index, "url", reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Pin</h3>
        <label>Pin Color:</label>
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="#000000">Black</option>
          <option value="#444444">Dark Gray</option>
          <option value="#bbbbbb">Light Gray</option>
          <option value="#ffffff">White</option>
          <option value="#ff0000">Red</option>
          <option value="#cc0000">Dark Red</option>
          <option value="#ffa500">Orange</option>
          <option value="#cc8400">Dark Orange</option>
          <option value="#ffff00">Yellow</option>
          <option value="#cccc00">Dark Yellow</option>
          <option value="#008000">Green</option>
          <option value="#004000">Dark Green</option>
          <option value="#0000ff">Blue</option>
          <option value="#000080">Dark Blue</option>
          <option value="#800080">Purple</option>
          <option value="#4b004b">Dark Purple</option>
          <option value="#a52a2a">Brown</option>
        </select>

        <h4>Images:</h4>
        {images.map((img, index) => (
          <div key={index} style={{ marginBottom: "1em" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageFile(e, index)}
            />
            <textarea
              placeholder="Text for image"
              value={img.text}
              onChange={(e) => handleImageChange(index, "text", e.target.value)}
              style={{ width: "100%", marginTop: "0.5em" }}
            />
            <button onClick={() => handleRemoveImage(index)}>
              Remove Image
            </button>
          </div>
        ))}
        <button onClick={handleAddImage}>Add Image</button>

        <div style={{ marginTop: "1em" }}>
          <button onClick={() => onSave({ color, images })}>Save</button>
          <button onClick={onDelete}>Delete Pin</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default PinEditor;
