import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const COLORS = [
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "brown",
  "black",
  "white",
];

function App() {
  const containerRef = useRef(null);

  const [pins, setPins] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [draggingPinId, setDraggingPinId] = useState(null);
  const [draggingMap, setDraggingMap] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [imageViewer, setImageViewer] = useState({ open: false, index: 0 });
  const [filterColors, setFilterColors] = useState([]);

  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Load saved project when projectName changes and is not empty
  useEffect(() => {
    if (!projectName) return;
    const saved = localStorage.getItem(`MapPins_${projectName}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPins(data.pins || []);
        setBackgroundImage(data.backgroundImage || null);
        setZoom(data.zoom || 1);
        setOffset(data.offset || { x: 0, y: 0 });
      } catch {
        // ignore parse errors
      }
    } else {
      // clear if new projectName with no saved data
      setPins([]);
      setBackgroundImage(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
    setSelectedPin(null);
    setFilterColors([]);
    setImageViewer({ open: false, index: 0 });
  }, [projectName]);

  // Save current state to localStorage whenever these change and projectName is set
  useEffect(() => {
    if (!projectName) return;
    const data = {
      pins,
      backgroundImage,
      zoom,
      offset,
    };
    localStorage.setItem(`MapPins_${projectName}`, JSON.stringify(data));
  }, [pins, backgroundImage, zoom, offset, projectName]);

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBackgroundImage(reader.result);
    reader.readAsDataURL(file);
  };

  const addPinAtCenter = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (rect.width / 2 - offset.x) / zoom;
    const y = (rect.height / 2 - offset.y) / zoom;
    setPins([...pins, { id: Date.now(), x, y, color: "red", images: [] }]);
  };

  const updatePin = (id, changes) => {
    setPins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    );
  };

  const removePin = (id) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
    if (selectedPin === id) setSelectedPin(null);
  };

  const handleImageUpload = (pinId, e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(
      (file) =>
        new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res({ src: reader.result, text: "" });
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((images) => {
      updatePin(pinId, {
        images: [
          ...(pins.find((p) => p.id === pinId)?.images || []),
          ...images,
        ],
      });
    });
  };

  const onMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      addPinAtCenter();
    } else if (e.button === 2) {
      e.preventDefault();
      setDraggingMap(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      offsetStart.current = { ...offset };
    }
  };

  const onMouseMove = (e) => {
    if (draggingPinId !== null) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = (e.clientX - rect.left - offset.x) / zoom;
      const newY = (e.clientY - rect.top - offset.y) / zoom;
      updatePin(draggingPinId, { x: newX, y: newY });
    } else if (draggingMap) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({
        x: offsetStart.current.x + dx,
        y: offsetStart.current.y + dy,
      });
    }
  };

  const onMouseUp = () => {
    setDraggingMap(false);
    setDraggingPinId(null);
  };

  const getPinSize = () => {
    const baseSize = Math.max(6, 14 / zoom);
    if (zoom > 1) {
      return baseSize / 3; // half size when zoomed in
    }
    return baseSize;
  };

  const visiblePins = pins.filter(
    (p) => filterColors.length === 0 || filterColors.includes(p.color)
  );

  const pinColorsPresent = [...new Set(pins.map((p) => p.color))];

  return (
    <div
      className="app"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="top-bar">
        <input type="file" accept="image/*" onChange={handleBackgroundUpload} />
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <button onClick={addPinAtCenter}>Add Pin</button>
      </div>

      <div
        className="map-container"
        ref={containerRef}
        style={{
          backgroundImage: `url(${backgroundImage || ""})`,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        }}
        onMouseDown={onMouseDown}
      >
        {visiblePins.map((pin) => (
          <div
            key={pin.id}
            className="pin"
            style={{
              left: pin.x,
              top: pin.y,
              backgroundColor: pin.color,
              width: getPinSize(),
              height: getPinSize(),
            }}
            onMouseDown={(e) => e.button === 0 && setDraggingPinId(pin.id)}
            onClick={(e) => {
              if (e.button === 0) setSelectedPin(pin.id);
            }}
          />
        ))}
      </div>

      <div className="zoom-slider">
        <label>Zoom: {zoom.toFixed(2)}x</label>
        <input
          type="range"
          min="1"
          max="15"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        />
      </div>

      <div className="filter-panel">
        <strong>Filter Pins:</strong>
        {pinColorsPresent.map((color) => (
          <div className="color-swatch" key={color}>
            <div
              className="swatch"
              style={{ backgroundColor: color }}
              onClick={() =>
                setFilterColors((prev) =>
                  prev.includes(color)
                    ? prev.filter((c) => c !== color)
                    : [...prev, color]
                )
              }
            ></div>
            <input type="text" defaultValue={color} />
          </div>
        ))}
      </div>

      {selectedPin !== null && (
        <PinEditor
          pin={pins.find((p) => p.id === selectedPin)}
          updatePin={updatePin}
          removePin={removePin}
          close={() => setSelectedPin(null)}
          handleImageUpload={handleImageUpload}
          openViewer={() => setImageViewer({ open: true, index: 0 })}
        />
      )}

      {imageViewer.open && (
        <ImageViewer
          images={pins.find((p) => p.id === selectedPin)?.images || []}
          index={imageViewer.index}
          onClose={() => setImageViewer({ open: false, index: 0 })}
          onNext={() =>
            setImageViewer((v) => ({
              ...v,
              index:
                (v.index + 1) %
                pins.find((p) => p.id === selectedPin)?.images.length,
            }))
          }
          onPrev={() =>
            setImageViewer((v) => ({
              ...v,
              index:
                (v.index -
                  1 +
                  pins.find((p) => p.id === selectedPin)?.images.length) %
                pins.find((p) => p.id === selectedPin)?.images.length,
            }))
          }
        />
      )}
    </div>
  );
}

function PinEditor({
  pin,
  updatePin,
  removePin,
  close,
  handleImageUpload,
  openViewer,
}) {
  const updateImageText = (index, text) => {
    const newImages = [...pin.images];
    newImages[index].text = text;
    updatePin(pin.id, { images: newImages });
  };

  return (
    <div className="pin-editor">
      <h3>Edit Pin</h3>
      <label>Color:</label>
      <select
        value={pin.color}
        onChange={(e) => updatePin(pin.id, { color: e.target.value })}
      >
        {COLORS.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
      <label>Add Images:</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleImageUpload(pin.id, e)}
      />
      <ul className="image-list">
        {pin.images.map((img, i) => (
          <li key={i} className="image-list-item">
            <img src={img.src} className="thumb" alt="preview" />
            <textarea
              value={img.text}
              onChange={(e) => updateImageText(i, e.target.value)}
            />
          </li>
        ))}
      </ul>
      {pin.images.length > 0 && <button onClick={openViewer}>View</button>}
      <button onClick={() => removePin(pin.id)}>Remove Pin</button>
      <button onClick={close}>Close</button>
    </div>
  );
}

function ImageViewer({ images, index, onClose, onNext, onPrev }) {
  return (
    <div className="image-viewer">
      <img src={images[index].src} alt="Fullscreen" />
      <textarea value={images[index].text} readOnly />
      <div className="controls">
        <button onClick={onPrev}>Prev</button>
        <button onClick={onNext}>Next</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default App;
