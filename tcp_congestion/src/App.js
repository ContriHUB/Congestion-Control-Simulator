import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

function App() {
  const [nodes, setNodes] = useState([]);//This state will contain all the info(cwnd, ssthresh, sent , lost, ack) for each node
  //in the form of array of js objects
  const [connections, setConnections] = useState([]); // Connection matrix (bi-directional)
  const [numNodes, setNumNodes] = useState(0); // Number of nodes to be created
  const [newConnection, setNewConnection] = useState({ from: 0, to: 0 }); // For creating connections
  const [selectedNodeId, setSelectedNodeId] = useState(0); // Selected source node
  const [selectedDestNodeId, setSelectedDestNodeId] = useState(1); // Selected destination node
  const [lost_pkt, setLost_pkt] = useState(0); // Packet to be marked as lost
  const [duplicateAckCount, setDuplicateAckCount] = useState(0);

  // Handler for setting number of nodes
  const handleNumNodesChange = (event) => {
    setNumNodes(parseInt(event.target.value));
  };

  // Create nodes dynamically based on user input
  const createNodes = () => {
    const newNodes = Array.from({ length: numNodes }, (_, id) => ({
      id,
      cwnd: 1,
      ssthresh: 64,
      sent: [0],
      lost: [],
      ack: 0,
    }));
    setNodes(newNodes);
  };

  // Handle changes in node connections
  const handleConnectionChange = (event) => {
    const { name, value } = event.target;
    setNewConnection({ ...newConnection, [name]: parseInt(value) });
  };

  // Add a connection between two nodes
  const addConnection = () => {
    const { from, to } = newConnection;
    if (
      from >= 0 && from < nodes.length &&
      to >= 0 && to < nodes.length &&
      from !== to &&
      !connections.some(conn => (conn[0] === from && conn[1] === to) || (conn[1] === from && conn[0] === to))
    ) {
      setConnections([...connections, [from, to]]);
    }
  };

  // Handle lost packet simulation
  const handleChangeLostPkt = (event) => {
    setLost_pkt(parseInt(event.target.value));
  };

  const handleLost = () => {
    const sourceNode = nodes.find(node => node.id === selectedNodeId);
    if (sourceNode.lost.indexOf(lost_pkt) === -1 && sourceNode.sent.indexOf(lost_pkt) !== -1) {
      const updatedLost = [...sourceNode.lost, lost_pkt];
      setNodes(nodes.map(node =>
        node.id === selectedNodeId ? { ...node, lost: updatedLost } : node
      ));
    }
  };

  // Check if connection exists between selected source and destination
  const isConnected = (from, to) => {
    return connections.some(conn => (conn[0] === from && conn[1] === to) || (conn[1] === from && conn[0] === to));
  };

  const handleClick = () => {
    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes];
      const currentNode = { ...updatedNodes[selectedNodeId] };
  
      // Fast Retransmit Logic
      if (currentNode.lost.length > 0) {
        console.log(`Node ${selectedNodeId}: Checking for lost packets...`);
        
        // Check for 3 duplicate ACKs to trigger fast retransmit
        if (duplicateAckCount === 3) {
          const lostPacket = currentNode.lost[0]; // The first lost packet to retransmit
          currentNode.sent = [...currentNode.sent, lostPacket]; // Add lost packet back to sent
          console.log(`Node ${selectedNodeId}: Fast retransmit for lost packet ${lostPacket}`);
          
          // Adjust the congestion window after retransmission
          currentNode.cwnd = Math.min(currentNode.cwnd * 2, currentNode.ssthresh); // CWND is doubled, but capped at ssthresh
          console.log(`Node ${selectedNodeId}: Updated congestion window (CWND): ${currentNode.cwnd}`);
          setDuplicateAckCount(0); // Reset duplicate ACK count
        } else {
          // Acknowledge the lost packet but do not retransmit yet
          currentNode.ack = currentNode.lost[0];
          console.log(`Node ${selectedNodeId}: ACK for lost packet ${currentNode.ack}, duplicate ACK count: ${duplicateAckCount}`);
        }
      } else {
        // Acknowledge the last sent packet if no packets are lost
        currentNode.ack = currentNode.sent[currentNode.sent.length - 1] + 1; // Acknowledge the next packet
        console.log(`Node ${selectedNodeId}: ACK for the last sent packet ${currentNode.ack}`);
      }
  
      // Increment duplicate ACK count if the same ACK is received
      if (currentNode.ack === currentNode.sent[currentNode.sent.length - 1]) {
        // Increment the duplicate ACK counter if the ACK is for the last sent packet
        setDuplicateAckCount((prev) => prev + 1); // Increase duplicate ACK counter
        console.log(`Node ${selectedNodeId}: Received duplicate ACK, count: ${duplicateAckCount + 1}`);
      } else {
        setDuplicateAckCount(0); // Reset if a new ACK is received
        console.log(`Node ${selectedNodeId}: New ACK received, resetting duplicate ACK count.`);
      }
  
      // Update the current node with the new state
      updatedNodes[selectedNodeId] = currentNode;
      return updatedNodes; // Return the updated nodes array
    });
  };
  
  const handleNext = () => {
    if (!isConnected(selectedNodeId, selectedDestNodeId)) {
      alert(`No connection exists between Node ${selectedNodeId} and Node ${selectedDestNodeId}`);
      return;
    }
  
    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes];
      const currentNode = { ...updatedNodes[selectedNodeId] };
  
      // Check if there are lost packets
      if (currentNode.lost.length > 0) {
        console.log(`Node ${selectedNodeId}: Handling lost packets.`);
  
        if (duplicateAckCount >= 3) {
          // Fast retransmit logic
          const lostPacket = currentNode.lost[0]; // Assume the first lost packet needs to be retransmitted
          currentNode.sent.push(lostPacket); // Retransmit the lost packet
          console.log(`Node ${selectedNodeId}: Fast retransmit for lost packet ${lostPacket}.`);
  
          // Adjust cwnd for fast recovery
          currentNode.cwnd = Math.min(currentNode.cwnd * 2, currentNode.ssthresh);
          console.log(`Node ${selectedNodeId}: Updated cwnd during fast recovery: ${currentNode.cwnd}`);
        } else {
          // Handle normal lost packets
          console.log(`Node ${selectedNodeId}: Lost packets present but not enough duplicate ACKs.`);
          currentNode.cwnd = Math.max(1, currentNode.cwnd / 2); // Halve cwnd for lost packets
          currentNode.sent = currentNode.lost; // Reset sent to lost packets
          currentNode.lost = []; // Clear lost packets
          console.log(`Node ${selectedNodeId}: Sent packets updated to lost packets: ${JSON.stringify(currentNode.sent)}`);
        }
      } else {
        // Increase cwnd if no lost packets
        if (currentNode.cwnd < currentNode.ssthresh) {
          currentNode.cwnd += 1; // Increase cwnd in slow start phase
          currentNode.sent = Array.from({ length: currentNode.cwnd }, (v, i) => currentNode.ack + 1 + i);
          console.log(`Node ${selectedNodeId}: cwnd increased to ${currentNode.cwnd}. New sent packets: ${JSON.stringify(currentNode.sent)}`);
          setDuplicateAckCount(0); // Reset duplicate ACK count
        } else {
          // If we reached the threshold
          currentNode.cwnd = 1; // Reset cwnd
          currentNode.ssthresh = Math.floor(currentNode.ssthresh / 2); // Halve ssthresh
          currentNode.sent = Array.from({ length: currentNode.cwnd }, (v, i) => currentNode.ack + 1 + i);
          console.log(`Node ${selectedNodeId}: Threshold reached. cwnd reset to 1, ssthresh halved to ${currentNode.ssthresh}. New sent packets: ${JSON.stringify(currentNode.sent)}`);
        }
      }
  
      // Final logs for the state
      console.log(`Node ${selectedNodeId}: Current cwnd (Congestion Window): ${currentNode.cwnd}`);
      console.log(`Node ${selectedNodeId}: Current ssthresh (Slow Start Threshold): ${currentNode.ssthresh}`);
      console.log(`Node ${selectedNodeId}: Sent Packets: ${JSON.stringify(currentNode.sent)}`);
  
      updatedNodes[selectedNodeId] = currentNode;
      return updatedNodes; // Return the updated nodes
    });
  };
  
  

  return (
    <div className="App">
      <header className="App-header">
        Simulate Congestion Control Algorithms with Multiple Nodes
      </header>
      <div className="App-body">

        {/* Input for number of nodes */}
        <div className="initialvalues">
          <h3>Enter the number of nodes:</h3>
          <input
            type="number"
            value={numNodes}
            onChange={handleNumNodesChange}
          />
          <button onClick={createNodes}>Create Nodes</button>
        </div>

        {/* Input for connections between nodes */}
        <div>
          <h3>Define connections between nodes:</h3>
          <div>
            <label>From Node:</label>
            <input
              type="number"
              name="from"
              value={newConnection.from}
              onChange={handleConnectionChange}
              min="0"
              max={numNodes - 1}
            />
            <label>To Node:</label>
            <input
              type="number"
              name="to"
              value={newConnection.to}
              onChange={handleConnectionChange}
              min="0"
              max={numNodes - 1}
            />
            <button onClick={addConnection}>Add Connection</button>
          </div>

          <h4>Existing Connections:</h4>
          <ul>
            {connections.map((conn, index) => (
              <li key={index}>Node {conn[0]} ↔ Node {conn[1]}</li>
            ))}
          </ul>
        </div>

        {/* Node selection for simulation */}
        {nodes.length > 0 && (
          <>
            <div className="initialvalues">
              <div className='pkthead'>
                <h2>Select Source Node</h2>
                <select onChange={(e) => setSelectedNodeId(parseInt(e.target.value))} value={selectedNodeId}>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>Node {node.id}</option>
                  ))}
                </select>
              </div>
              <div className='pkthead'>
                <h2>Select Destination Node</h2>
                <select onChange={(e) => setSelectedDestNodeId(parseInt(e.target.value))} value={selectedDestNodeId}>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>Node {node.id}</option>
                  ))}
                </select>
              </div>
              <div className='pkthead'>
                <h2>Congestion Window (Node {selectedNodeId})</h2>
                {nodes[selectedNodeId].cwnd}
              </div>
              <div className='pkthead'>
                <h2>Slow Start Threshold (Node {selectedNodeId})</h2>
                {nodes[selectedNodeId].ssthresh}
              </div>
            </div>

            <div className='send'>
              <div>
                <h4>Packets to be transferred from Node {selectedNodeId}</h4>
                <h5># {nodes[selectedNodeId].sent.join(', ')}</h5>
              </div>
              <div>
                <h4>Packets simulated as lost in this window</h4>
                <h5># {nodes[selectedNodeId].lost.join(', ')}</h5>
                <input onChange={handleChangeLostPkt} value={lost_pkt} />
                <button onClick={handleLost}>Mark as Lost</button>
              </div>
            </div>

            {/* Simulation buttons */}
            <button onClick={handleClick} className="simulate">
              Simulate Packet Transfer for Current Window
            </button>
            <div className="ack">
              <h2>Received Acknowledgement (ACK): {nodes[selectedNodeId].ack}</h2>
            </div>
            <button onClick={handleNext} className="simulate">
              Shift the Window for Next Simulation Round
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default App;
