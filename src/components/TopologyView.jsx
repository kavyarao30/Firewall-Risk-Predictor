import { useState } from 'react';

// Topology View Component

// Topology network data
const TOPOLOGY_DATA = {
  nodes: [
    { id: 'internet', label: 'Internet', type: 'external', x: 100, y: 60 },
    { id: 'cdn', label: 'CDN', type: 'security', x: 250, y: 60 },
    { id: 'waf', label: 'WAF', type: 'security', x: 400, y: 60 },
    { id: 'lb', label: 'Load Balancer', type: 'network', x: 550, y: 60 },
    { id: 'api-gateway', label: 'API Gateway', type: 'service', x: 250, y: 180 },
    { id: 'app-service', label: 'App Service', type: 'service', x: 400, y: 180 },
    { id: 'database', label: 'Database', type: 'datastore', x: 325, y: 300 },
    { id: 'admin', label: 'Admin Portal', type: 'service', x: 550, y: 180 },
    { id: 'jump-host', label: 'Jump Host', type: 'security', x: 700, y: 180 },
  ],
  edges: [
    { from: 'internet', to: 'cdn', label: 'HTTPS', color: '#4caf50' },
    { from: 'cdn', to: 'waf', label: 'HTTPS', color: '#4caf50' },
    { from: 'waf', to: 'lb', label: 'HTTPS', color: '#4caf50' },
    { from: 'lb', to: 'api-gateway', label: 'HTTP', color: '#2196f3' },
    { from: 'lb', to: 'app-service', label: 'HTTP', color: '#2196f3' },
    { from: 'api-gateway', to: 'database', label: 'TCP:5432', color: '#9c27b0' },
    { from: 'app-service', to: 'database', label: 'TCP:5432', color: '#9c27b0' },
    { from: 'lb', to: 'admin', label: 'HTTPS', color: '#ff9800' },
    { from: 'admin', to: 'jump-host', label: 'SSH:22', color: '#f44336' },
  ],
};

export default function TopologyView() {
  const [selectedNode, setSelectedNode] = useState(null);

  const getNodeColor = (type) => {
    const colors = {
      external: '#f44336',
      service: '#2196f3',
      security: '#ff9800',
      network: '#4caf50',
      datastore: '#9c27b0'
    };
    return colors[type] || '#999';
  };

  const getNodeIcon = (type) => {
    const icons = {
      external: '🌐',
      service: '🔧',
      security: '🔒',
      network: '📡',
      datastore: '💾'
    };
    return icons[type] || '•';
  };

  return (
    <div className="topology-view">
      <div className="topology-header">
        <h2>Network Topology</h2>
        <p>Firewall protection layers and data flow</p>
      </div>

      <div className="topology-container">
        {/* Legend */}
        <div className="topology-legend">
          <h3>Legend</h3>
          <div className="legend-items">
            {Object.entries({
              external: 'External/Internet',
              service: 'Service',
              security: 'Security Layer',
              network: 'Network Component',
              datastore: 'Data Store'
            }).map(([type, label]) => (
              <div key={type} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: getNodeColor(type) }}
                ></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <svg className="topology-canvas" viewBox="0 0 800 350">
          {/* Draw edges first (so they appear behind nodes) */}
          {TOPOLOGY_DATA.edges.map((edge, idx) => {
            const fromNode = TOPOLOGY_DATA.nodes.find(n => n.id === edge.from);
            const toNode = TOPOLOGY_DATA.nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return null;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edge.color}
                  strokeWidth="2"
                  strokeDasharray="0"
                />
                {/* Port label on edge */}
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2 - 5}
                  className="edge-label"
                  fill={edge.color}
                  fontSize="12"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Draw nodes */}
          {TOPOLOGY_DATA.nodes.map(node => (
            <g
              key={node.id}
              className="topology-node"
              onClick={() => setSelectedNode(node)}
              style={{ cursor: 'pointer' }}
            >
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r="40"
                fill={getNodeColor(node.type)}
                opacity={selectedNode?.id === node.id ? 1 : 0.7}
                style={{
                  transition: 'opacity 0.3s'
                }}
              />

              {/* Node icon */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize="24"
                className="node-icon"
              >
                {getNodeIcon(node.type)}
              </text>

              {/* Node label */}
              <text
                x={node.x}
                y={node.y + 60}
                textAnchor="middle"
                fontSize="13"
                fontWeight="500"
                fill="#333"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Node Details */}
        {selectedNode && (
          <div className="topology-details">
            <h3>{selectedNode.label}</h3>
            <div className="detail-info">
              <p>
                <strong>Type:</strong> {selectedNode.type}
              </p>
              <p>
                <strong>Position:</strong> ({selectedNode.x}, {selectedNode.y})
              </p>

              {/* Connected nodes */}
              <div className="connections">
                <p>
                  <strong>Connections:</strong>
                </p>
                <ul>
                  {TOPOLOGY_DATA.edges
                    .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                    .map((edge, idx) => {
                      const connectedId = edge.from === selectedNode.id ? edge.to : edge.from;
                      const connectedNode = TOPOLOGY_DATA.nodes.find(n => n.id === connectedId);
                      return (
                        <li key={idx}>
                          ↔ {connectedNode?.label} (Port: {edge.label})
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="topology-description">
        <h3>Data Flow</h3>
        <p>
          Incoming requests flow through the CDN and WAF for protection, then to the load balancer,
          which distributes to API Gateway and Application services. Both services access the
          database. Administrative and vendor access goes through the Jump Host for security.
        </p>
      </div>
    </div>
  );
}
