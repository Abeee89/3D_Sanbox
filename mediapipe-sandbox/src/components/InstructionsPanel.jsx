import './InstructionsPanel.css';

/**
 * InstructionsPanel Component - Instruksi gestur statis
 */
function InstructionsPanel() {
  const instructions = [
    { key: 'KLIK & SERET', action: 'Putar Arena' },
    { key: 'DUA TANGAN TERBUKA', action: 'Munculkan Objek' },
    { key: 'SATU TANGAN CUBIT', action: 'Ambil Objek' }
  ];

  return (
    <div className="panel instructions-panel">
      <h1>Gestur & Kontrol (2 Tangan)</h1>
      <div className="instructions">
        {instructions.map((item, index) => (
          <div key={index} className="gesture-item">
            <span className="gesture-key">{item.key}</span>
            {item.action}
          </div>
        ))}
      </div>
    </div>
  );
}

export default InstructionsPanel;
