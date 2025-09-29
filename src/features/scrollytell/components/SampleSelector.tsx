import React from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import './SampleSelector.css';

const SampleSelector: React.FC = () => {
  const { selectedSampleId, availableSamples, selectSample } = useScrollyTell();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    selectSample(event.target.value);
  };

  return (
    <div className="sample-selector">
      <label htmlFor="sample-select" className="sample-selector-label">
        ScrollyTell Demo:
      </label>
      <select
        id="sample-select"
        className="sample-selector-dropdown"
        value={selectedSampleId || ''}
        onChange={handleChange}
      >
        {availableSamples.map((sample) => (
          <option key={sample.id} value={sample.id}>
            {sample.name}
          </option>
        ))}
      </select>
      {selectedSampleId && (
        <p className="sample-selector-description">
          {availableSamples.find(s => s.id === selectedSampleId)?.description}
        </p>
      )}
    </div>
  );
};

export default SampleSelector;