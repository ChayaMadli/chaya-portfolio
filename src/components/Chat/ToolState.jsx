import React from 'react';

export function ToolState({ toolState }) {
  if (!toolState) {
    return null;
  }

  const { type, input, output, error } = toolState;

  // 1. INPUT STREAMING
  if (type === 'tool-input-streaming') {
    return (
      <div className="tool-state tool-state-streaming">
        <div className="tool-state-icon">⚡</div>

        <div className="tool-state-content">
          <div className="tool-state-title">
            Preparing project lookup
          </div>

          <div className="tool-state-description">
            Getting the portfolio tool ready...
          </div>

          <div className="tool-state-loader">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  // 2. INPUT AVAILABLE
  if (type === 'tool-input-available') {
    const projectLabels = {
      colorDetector: 'Color Detector Using ESP32-CAM',
      soldierMonitoring:
        'Wearable IoT-Based Soldier Health and Safety Monitoring System',
      homeAutomation: 'Voice-Controlled Home Automation',
    };

    const projectName =
      projectLabels[input?.project] ||
      input?.project ||
      'Selected project';

    return (
      <div className="tool-state tool-state-input">
        <div className="tool-state-icon">🔎</div>

        <div className="tool-state-content">
          <div className="tool-state-title">
            Project lookup
          </div>

          <div className="tool-state-description">
            Looking up portfolio information for:
          </div>

          <div className="tool-input-value">
            {projectName}
          </div>
        </div>
      </div>
    );
  }

  // 3. OUTPUT AVAILABLE
  if (type === 'tool-output-available' && output) {
    return (
      <div className="tool-result-card">
        <div className="tool-result-header">
          <div>
            <div className="tool-result-eyebrow">
              PROJECT RESULT
            </div>

            <h3 className="tool-result-title">
              {output.name}
            </h3>

            <div className="tool-result-category">
              {output.category}
            </div>
          </div>

          <div className="tool-result-success">
            ✓
          </div>
        </div>

        <div className="tool-result-section">
          <div className="tool-result-label">
            TECHNOLOGIES
          </div>

          <div className="tool-result-tags">
            {output.technologies?.map((technology) => (
              <span
                className="tool-result-tag"
                key={technology}
              >
                {technology}
              </span>
            ))}
          </div>
        </div>

        <div className="tool-result-section">
          <div className="tool-result-label">
            DESCRIPTION
          </div>

          <p className="tool-result-description">
            {output.description}
          </p>
        </div>

        <div className="tool-result-footer">
          <span className="tool-result-label">
            ROLE
          </span>

          <span className="tool-result-role">
            {output.role}
          </span>
        </div>
      </div>
    );
  }

  // 4. OUTPUT ERROR
  if (type === 'tool-output-error') {
    return (
      <div className="tool-state tool-state-error">
        <div className="tool-state-icon">⚠</div>

        <div className="tool-state-content">
          <div className="tool-state-title">
            Project lookup failed
          </div>

          <div className="tool-state-description">
            {error ||
              'We could not retrieve the requested project information.'}
          </div>

          <div className="tool-error-hint">
            Try asking about another portfolio project.
          </div>
        </div>
      </div>
    );
  }

  return null;
}