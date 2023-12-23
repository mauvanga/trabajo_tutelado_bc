import React, { useCallback, useEffect, useState, useRef} from "react";
import './styles.css';
import { create } from 'kubo-rpc-client';
import { ethers } from "ethers";
import { Buffer } from "buffer";
import logo from "./cangas.png";
import { addresses, abis } from "./contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

function App() {

  useEffect(() => {
    window.ethereum.enable();
  }, []);


//Contract
  const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
  const ipfsContract = new ethers.Contract(addresses.ipfs, abis.ipfs, defaultProvider);
  
//Message
  const [message, setMessage] = useState(null);
  const [messageTimeout, setMessageTimeout] = useState(null);
  
  const showMessage = (msg, duration = 3000) => {
  setMessage(msg);
  clearTimeout(messageTimeout);
  const timeout = setTimeout(() => {
    setMessage(null);
  }, duration);
  setMessageTimeout(timeout);
};



//IPFS
  const [ipfsHash, setIpfsHash] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  
   useEffect(() => {
    async function readFile() {
      try {
        const result = await ipfsContract.getCensusForZone(defaultProvider.getSigner().getAddress());
        if (result !== ZERO_ADDRESS) setIpfsHash(result);
      } catch (error) {
        console.error("Error fetching census for zone:", error.message);
      }
    }
    readFile();
  }, [defaultProvider]);

  const setFileIPFS = async (hash) => {
    const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
    console.log("TX contract");
    const tx = await ipfsWithSigner.setFileIPFS(hash);
    console.log({ tx });
    setIpfsHash(hash);
  };
  
  const handleFileChange = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(Buffer(reader.result));
    };

    const fileName = fileInputRef.current.files[0]?.name;
    const label = document.getElementById('file-label');
    if (label) label.textContent = fileName || 'Browse';
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const client = await create('/ip4/0.0.0.0/tcp/5001');
    const result = await client.add(file);
    await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);
    console.log(result.cid);
    await setFileIPFS(result.cid.toString());
  } catch (error) {
    console.log(error.message);
  }
};

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      console.log("Buffer data: ", Buffer(reader.result));
      setFile(Buffer(reader.result));
    }
    e.preventDefault();
  };
  
  
//Candidates
  const [candidateName, setCandidateName] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [executedFetch, setExecutedFetch] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  
  const fetchCandidates = useCallback(async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ipfs, abis.ipfs, signer);

      const eventListener = contract.on("AvailableCandidate", (candidateName, candidateIndex) => {
        setCandidates(prevCandidates => [
          ...prevCandidates,
          { name: candidateName, index: candidateIndex }
        ]);
      });

      await contract.showAvailableCandidates();

      return () => {
        eventListener.removeAllListeners();
      };
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  }, []);

  useEffect(() => {
    if (showCandidates && !executedFetch) {
      fetchCandidates();
      setExecutedFetch(true);
    }
  }, [showCandidates, executedFetch, fetchCandidates]);

  const handleShowCandidates = () => {
  setShowCandidates(prevShowCandidates => !prevShowCandidates);
};


//Change of page
  const [mostrarPrimeraPagina, setMostrarPrimeraPagina] = useState(true);
  
  const handleMostrarSegundaPagina = () => {
    setMostrarPrimeraPagina(false);
  };
  
  const handleVolverPrimeraPagina = () => {
    setMostrarPrimeraPagina(true);
  };


//Results
   const [showResults, setShowResults] = useState(false);
   const [resultados, setResultados] = useState([]);
   
   const handleShowResults = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ipfs, abis.ipfs, signer);
      
      const tx = await contract.showResults();
      tx.wait().then(() => {
        contract.on("CandidateResult", (candidateName, votes) => {
          setResultados(prevResults => [...prevResults, { name: candidateName, votes: votes }]);
        });
      });
    } catch (error) {
      console.error("Error al mostrar resultados:", error);
    }
  };
  
   const handleToggleResults = () => {
   setShowResults(prev => !prev);
   if (!showResults) {
    handleShowResults();
  }
};
  

//Vote

  const handleVote = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(addresses.ipfs, abis.ipfs, signer);

    await contract.vote(candidateName);
    showMessage(`Votaste por ${candidateName}`);
  } catch (error) {
    showMessage(`Error al votar`);
    console.error("Error al votar:", error);
  }
};

//Web design

  return (
    <div className="App">
      <header className="black-header" style={{ backgroundColor: 'black' }}>
        <div className="header-content" style={{ color: 'white' }}>
          <p style={{ marginLeft: '10px' }}>P.º de Castelao, 2, 36940 Cangas</p>
          <p style={{ marginLeft: '10px' }}>986 30 00 50</p>
        </div>
      </header>
      <header className="white-header">
        <div className="header-content">
        <img src={logo} className="App-logo" alt="logo" style={{ width: '50px', height: '75px' }} />

          <h1>Concello de Cangas</h1>
        </div>
      </header>
      
      <div className="background"></div>

      {mostrarPrimeraPagina ? (
        <div>
          {/* First page */}
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
          </div>
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
  <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '20px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', marginTop: '50px' }}>
    <div style={{ textAlign: 'center' }}>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
    <h2>Votación para las elecciones municipales</h2>
    <p>Escriba aquí el nombre del candidato de su elección:</p>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <input
        type="text"
        value={candidateName}
        onChange={(e) => setCandidateName(e.target.value)}
  style={{
    width: '95%',
    marginBottom: '10px',
    height: '30px',
    fontSize: '18px',
    borderRadius: '10px',
    paddingLeft: '10px' 
  }}
      />
      <button onClick={handleVote} className="custom-button" style={{ width: '100%' }}>Votar</button>
          {message && (
  <div className="message">
    <p>{message}</p>
  </div>
)}

    </div>

    
    </div>
  </div>

          
          
<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '20px' }}>
  <div style={{ marginRight: '5px', width: '250px', maxHeight: '200px', overflowY: 'auto', textAlign: 'center' }}>
    <button onClick={handleShowCandidates} style={{ marginBottom: '10px' }} className="custom-button">
      {showCandidates ? "Ocultar candidatos" : "Candidatos disponibles"}
    </button>
    {showCandidates && (
      <div style={{ maxWidth: '200px', margin: '0 auto' }}>
        <ul style={{ padding: 0 }}>
          {candidates.map((candidate, index) => (
            <li key={index}>{`${candidate.name}`}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
  <div style={{ marginLeft: '5px', width: '250px', maxHeight: '200px', overflowY: 'auto', textAlign: 'center' }}>
    <button onClick={handleToggleResults} style={{ marginBottom: '10px' }} className="custom-button">
      {showResults ? 'Ocultar Resultados' : 'Resultados actuales'}
    </button>
    {showResults && (
      <div>
        <ul style={{ padding: 0 }}>
          {resultados.map((resultado, index) => (
            <li key={index}>
              {`${resultado.name}, Votos: ${resultado.votes}`}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>



            <button onClick={handleMostrarSegundaPagina} style={{ position: 'absolute', top: '10px', right: '10px' }}>Modo administrador</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
<div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '20px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', marginTop: '80px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Sistema de subida de censos</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
          <p>
            Suba aquí el archivo del censo:
          </p>
<form className="form" onSubmit={handleSubmit}>
  <label htmlFor="file-upload" className="custom-button" id="file-label">
    Browse
  </label>
  <input
    id="file-upload"
    type="file"
    name="data"
    onChange={handleFileChange}
    ref={fileInputRef}
    style={{ display: 'none' }} // Ocultar el input de file
  />
  <button type="submit" className="custom-button">
    Subir
  </button>
            {message && (
  <div className="message">
    <p>{message}</p>
  </div>
)}
</form>


          <button onClick={handleVolverPrimeraPagina} style={{ position: 'absolute', top: '10px', right: '10px' }}>Modo usuario</button>
        </div>
      </div>
    </div>
      )}

      <footer className="footer" style={{ backgroundColor: 'black', padding: '2px', marginTop: 'auto', color: 'white' }}>
        <p style={{ marginLeft: '10px' }}>Concello de Cangas 2023</p>
      </footer>
    </div>
  );

}



export default App;
//http://0.0.0.0:5001/ipfs/bafybeibozpulxtpv5nhfa2ue3dcjx23ndh3gwr5vwllk7ptoyfwnfjjr4q/#/files
