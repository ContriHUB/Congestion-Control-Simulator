import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [cwnd, setCwnd] = useState(1);
  const [ssthresh, setSsthresh] = useState(64);
  const [sent, setSent] = useState([0]);
  const [lost, setLost] = useState([]);
  const [lost_pkt, setLost_pkt] = useState(0);
  const [ack, setAck] = useState(0);
  const [packetLossRate, setPacketLossRate] = useState(0);
  const [latency, setLatency] = useState(500); // Increased default latency for slower simulation
  const [bandwidth, setBandwidth] = useState(0);
  const [simulationRunning, setSimulationRunning] = useState(false);

  const handleChangeThresh = (event) => {
    setSsthresh(parseInt(event.target.value));
  };

  const handleChange = (event) => {
    setLost_pkt(parseInt(event.target.value));
  };

  const handleLost = () => {
    if (lost.indexOf(lost_pkt) === -1 && sent.indexOf(lost_pkt) !== -1) {
      setLost([...lost, lost_pkt]);
    }
  };

  const handleClick = () => {
    if (lost.length > 0) {
      setAck(lost[0]);
    } else {
      setAck(sent[sent.length - 1] + 1);
    }
  };

  const handleNext = () => {
    if (cwnd < ssthresh && lost.length === 0) {
      setCwnd(cwnd + 1);
      setSent(Array.from({ length: cwnd + 1 }, (v, i) => ack + 1 + i));
    } else if (lost.length !== 0) {
      let last = sent[sent.length - 1];
      setCwnd(cwnd + 1);
      setSent(lost);
      if (sent.length <= cwnd)
        setSent(
          sent.concat(
            Array.from(
              { length: sent.length - cwnd + 1 },
              (v, i) => last + 1 + i
            )
          )
        );
      setLost([]);
    } else {
      setCwnd(1);
      setSsthresh(ssthresh / 2);
      setSent(Array.from({ length: cwnd + 1 }, (v, i) => ack + 1 + i));
    }
  };

  const startSimulation = () => {
    setCwnd(1);
    setSsthresh(64);
    setSent([0]);
    setLost([]);
    setAck(0);
    setSimulationRunning(true);
  };

  const stopSimulation = () => {
    setSimulationRunning(false);
  };

  // Automated simulation logic
  useEffect(() => {
    let interval;

    if (simulationRunning) {
      interval = setInterval(() => {
        const randomNum = Math.random();

        // Simulate packet loss
        if (randomNum < packetLossRate / 100) {
          setLost((prev) => [...prev, sent[sent.length - 1]]);
        }

        // Simulate acknowledgment step-by-step
        handleClick();

        // Handle next simulation step
        handleNext();
      }, latency); // Use latency as the interval time for slowing down the process

      // Cleanup on component unmount or when simulation stops
      return () => clearInterval(interval);
    }
  }, [simulationRunning, latency, packetLossRate, sent]);

  return (
    <div className="App">
      <header className="App-header">Congestion Control Simulator</header>
      <div className="App-body">
        <div className="initialvalues">
          <div className="pkthead">
            <h2>Congestion Window</h2>
            <p>{cwnd}</p>
          </div>
          <div className="pkthead">
            <h2>Slow Start Threshold</h2>
            <p>{ssthresh}</p>
          </div>
          <div className="pkthead">
            <h3>Change Initial Slow Start Threshold</h3>
            <input
              type="number"
              onChange={handleChangeThresh}
              value={ssthresh}
            />
          </div>
        </div>

        <div className="network-conditions">
          <h3>Set Network Conditions</h3>
          <div className="condition-inputs">
            <div>
              <label>Packet Loss Rate (%): </label>
              <input
                type="number"
                onChange={(e) => setPacketLossRate(e.target.value)}
              />
            </div>
            <div>
              <label>Latency (ms): </label>
              <input
                type="number"
                onChange={(e) => setLatency(e.target.value)}
              />
            </div>
            <div>
              <label>Bandwidth (kbps): </label>
              <input
                type="number"
                onChange={(e) => setBandwidth(e.target.value)}
              />
            </div>
            <div className="button-container">
              <button
                onClick={startSimulation}
                className="simulate start-button"
              >
                Start Simulation
              </button>
              <button onClick={stopSimulation} className="simulate stop-button">
                Stop Simulation
              </button>
            </div>
          </div>
        </div>

        <div className="send">
          <div className="packet-info">
            <h4>
              The packets to be transferred in this window have the following
              sequence numbers:
            </h4>
            <div className="packet-box">
              <h5>
                # <span className="packet-numbers">{sent.join(", ")}</span>
              </h5>
            </div>
          </div>

          <div className="packet-info">
            <h4>
              The packets to be simulated as lost in this window have the
              following sequence numbers:
            </h4>
            <div className="packet-box lost">
              <h5>
                #{" "}
                <span className="packet-numbers lost-numbers">
                  {lost.join(", ")}
                </span>
              </h5>
            </div>
          </div>

          <div className="lost-packet-input">
            <input
              type="number"
              onChange={handleChange}
              value={lost_pkt}
              placeholder="Enter lost packet number"
              className="lost-input"
            />
            <button onClick={handleLost} className="simulate small-button">
              Mark as Lost
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={handleClick} className="simulate">
            Simulate the packet transfer for current window
          </button>

          <div className="ack">
            <h2>
              Received Acknowledgement after transfer:
              <span className="ack-text"> ACK{ack}</span>
            </h2>
          </div>

          <button onClick={handleNext} className="simulate">
            Shift the window for next simulation round.
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
