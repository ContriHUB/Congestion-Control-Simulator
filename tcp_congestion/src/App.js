import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [cwnd, setCwnd] = useState(1);
  const [ssthresh, setSsthresh] = useState(64);
  const [sent, setSent] = useState([0]);
  const [lost, setLost] = useState([]);
  const [ack, setAck] = useState(0);
  const [lostPackets, setLostPackets] = useState([]);
  const [rounds, setRounds] = useState(10);
  const [currentRound, setCurrentRound] = useState(0);
  const [simulationRunning, setSimulationRunning] = useState(false);

  const handleChangeThresh = (event) => {
    setSsthresh(parseInt(event.target.value));
  };

  const handleSetLostPackets = (event) => {
    const packets = event.target.value.split(",").map(Number);
    setLostPackets(packets);
  };

  const handleSetRounds = (event) => {
    setRounds(parseInt(event.target.value));
  };

  const handleLost = () => {
    lostPackets.forEach((packet) => {
      if (!lost.includes(packet) && sent.includes(packet)) {
        setLost((prevLost) => [...prevLost, packet]);
      }
    });
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
    setCurrentRound(0);
    setSimulationRunning(true);
  };

  const stopSimulation = () => {
    setSimulationRunning(false);
  };

  // Automated simulation logic
  useEffect(() => {
    let interval;

    if (simulationRunning && currentRound < rounds) {
      interval = setInterval(() => {
        handleLost(); // Mark lost packets
        handleClick(); // Simulate packet acknowledgment
        handleNext(); // Move to next window

        setCurrentRound((prevRound) => prevRound + 1); // Increment round

        if (currentRound >= rounds - 1) {
          setSimulationRunning(false); // Stop the simulation once rounds are complete
          clearInterval(interval); // Clear interval when simulation ends
        }
      }, 1000); // 1 second delay for each round

      return () => clearInterval(interval); // Clean up interval when component unmounts
    }
  }, [simulationRunning, currentRound, rounds, ssthresh]);
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
            <h3>Set Initial Slow Start Threshold</h3>
            <input
              type="number"
              onChange={handleChangeThresh}
              value={ssthresh}
            />
          </div>
          <div className="pkthead">
            <h3>Set Number of Rounds</h3>
            <input type="number" onChange={handleSetRounds} value={rounds} />
          </div>
        </div>

        <div className="network-conditions">
          <h3>Set Network Conditions</h3>
          <div className="condition-inputs">
            <div>
              <label>Lost Packets (comma-separated): </label>
              <input
                type="text"
                onChange={handleSetLostPackets}
                placeholder="e.g. 1,2,3"
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
        </div>

        <div className="action-buttons">
          <div className="ack">
            <h2>
              Received Acknowledgement after transfer:
              <span className="ack-text"> ACK{ack}</span>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
