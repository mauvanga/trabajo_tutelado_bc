// SPDX-License-Identifier: GPL-3.0
// Autor: Marcos Villar Avión, Maria Andrea Ugarte Valencia
// Fecha: 28 de octubre de 2023
pragma solidity ^0.8.10;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract VotingSystemContract is Ownable{

    // CONSTS
    uint tamperValue = 5 ether;

    // Candidate Struct
    struct Candidate {
        uint id;
        string name;
        uint votes;
    }

    // Voter Struct
    struct Voter {
        bool voted;
        uint candidateId;
    }
    
    // Array to store all candidates
    Candidate[] public candidates;

    // Mapping to store the relation between address - Voter
    mapping(address => Voter) public voters;

    // Mapping to store if an user is an admin
    mapping(address => bool) isAdmin;

    // Mapping to store the relation between zone - census
    mapping(uint256 => string) censusForZone;

    // event Owner
    event addedCandidate(string candidateName);
    event deletedCandidate(string CandidateName);


    // EVENTS
    event RegistedVote(address voter, uint vote);
    event Winner(string name, uint votes);
    event CandidateResult(string name, uint votes);
    event addedCandidates(string[] addedCandidates);
    event CandidateVotes(uint votes);
    event AvailableCandidate(string name, uint id);

    // MODIFIERS

    /// @notice This modifier checks if the candidate exists
    /// @dev This modifier checks if the candidate exists
    modifier existCandidateName(string memory candidateName) {
        require(isNameInCandidates(candidateName),"This candidate does not exist!");
        _;
    }

    /// @notice This modifier checks if the candidate exists
    /// @dev This modifier checks if the candidate exists
    modifier notExistCandidateName(string memory candidateName) {
        require(!isNameInCandidates(candidateName),"This candidate already exists");
        _;
    }

    /// @notice This modifier checks if the user is an admin
    /// @dev This modifier checks if the user is an admin
    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Admin: caller is not an admin");
        _;
    }


    /// @notice This function takes an array input of candidate names and inserts those in candidate array
    /// @dev This function is called when we create the smart contract and takes an array input of candidate names and insert those in candidates array. We have to call Ownable constructor too.
    /// @param candidateNames Array of candidate names
    constructor(string[] memory candidateNames) Ownable(msg.sender) {
        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: candidateNames[i],
                votes: 0
            }));
        }
        emit addedCandidates(candidateNames);
    } 

    /// @notice This function adds an admin
    /// @dev This function is called when the Owner wants to add an admin
    /// @param newAdmin address of the new admin
    function addAdmin(address newAdmin) external onlyOwner {
        isAdmin[newAdmin] = true;
    }

    /// @notice This function removes an admin
    /// @dev This function is called when the Owner wants to remove an admin
    /// @param adminToRemove the address of the admin
    function removeAdmin(address adminToRemove) external onlyOwner {
        isAdmin[adminToRemove] = false;
    }

    /// @notice This function assigns a zone to a census
    /// @dev This function is called when an admin wants to assign a zone to a census
    /// @param IdZone the id of the zone
    /// @param ipfsHash the hash of the ipfs file
    function addCensusForZone(uint256 IdZone, string memory ipfsHash) external onlyAdmin {
        censusForZone[IdZone] = ipfsHash;
    }

    /// @notice This function shows the hash of the census of a zone
    /// @dev  This function is called when we want to obtain the census hash for a specific zone
    /// @param IdZone the id of the zone
    function getCensusForZone(uint256 IdZone) external view returns (string memory) {
        return censusForZone[IdZone];
    }

    /// @notice This function is called when the owner wants to add a new candidate
    /// @dev This function is called when the owner wants to add a new candidate to candidates array. Only owner can add more candidates 
    /// @param candidateName Name of the candidate
    function addCandidate(string memory candidateName) public notExistCandidateName(candidateName) onlyOwner{
        candidates.push(Candidate({
            id: candidates.length,
            name: candidateName,
            votes: 0
        }));
        emit addedCandidate(candidateName);
    }


    /// @notice This function is executed when a owner wants to remove a candidate
    /// @dev This function is executed when a owner wants to remove a candidate. Only owner can add more candidates. 
        /// This is a very expensive function because we have to iterate over candidates array so in that we are going to implement a workaround to be effective
    /// @param candidateName Name of the candidate
    function removeCandidate(string memory candidateName) public existCandidateName(candidateName) onlyOwner{
        for(uint i=0; i < candidates.length; i++){
            if(_hashCompareWithLengthCheck(candidates[i].name, candidateName)){
                // Before overwriting the candidate index -> emit the event
                emit deletedCandidate(candidates[i].name);
                
                //Overwriting the candidate index with the last element
                candidates[i] = candidates[candidates.length -1];

                //Drop the last element and get out the loop
                candidates.pop();
                break;
            }
        }

    }

    /// @notice This function is called by a voter to vote a candidate
    /// @dev This function is called by a Voter to vote a candidate. It checks if the voter has already vote and if the candidate_id really exists
    /// @param candidateName Id of the candidate that we want to vote
    function vote(string memory candidateName) existCandidateName(candidateName) public {
        require(voters[msg.sender].voted == false, "You have already voted");

        //Gets the candidate_id
        uint _candidate_id = getIdByName(candidateName);

        //Gathering information about the Voter
        voters[msg.sender] = Voter(true,_candidate_id);
        candidates[_candidate_id].votes++;

        emit RegistedVote(msg.sender, _candidate_id);
    }

    /// @notice This function shows the election results
    /// @dev This function shows the number of votes of each candidate.
    function showResults() public {
        for (uint i = 0; i < candidates.length; i++) 
        {
            emit CandidateResult(candidates[i].name, candidates[i].votes);
        }
    }

    /// @notice This function shows all available candidates
    /// @dev This function shows all available candidates and their id
    function showAvailableCandidates() public {
        for (uint i = 0; i < candidates.length; i++) 
        {
            emit AvailableCandidate(candidates[i].name, i);
        }
    }

    
    /// @notice This function shows the winner 
    /// @dev This function counts all votes, shows the winner and emits an event
    function showWinner() public {
        string memory winner = "";
        uint winner_votes = 0;

        for (uint i = 0; i < candidates.length; i++) 
        {
            if(candidates[i].votes > winner_votes){
                winner = candidates[i].name;
                winner_votes = candidates[i].votes;
            }
        }
        emit Winner(winner, winner_votes);
    }

    /// @notice This function is used to compare two string 
    /// @dev This function is used to compare two string and returns true if both strings are equal and false otherwise. The comparation is carried out by using keccak256 hash function
    /// @param _a First string
    /// @param _b Second string
    /// return bool True if both strings are equal and false otherwise.
    function _hashCompareWithLengthCheck(string memory _a, string memory _b) internal pure returns (bool) {
        if(bytes(_a).length != bytes(_b).length) {
            return false;
        } else {
            return keccak256(abi.encodePacked(_a)) == keccak256(abi.encodePacked(_b));
        }
    }


    /// @notice This function checks if the candidate name exists in our candidates vector and returns the result
    /// @dev This function checks if the candidate name exists in our candidates vector and returns the result
    /// @param candidateName Candidate name
    /// return bool True if the candidate name is in candidate vector and false otherwise
    function isNameInCandidates(string memory candidateName) private view returns(bool) {
        for(uint i = 0; i < candidates.length; i++){
            if(_hashCompareWithLengthCheck(candidates[i].name,candidateName)){
                return true;
            }
        }
        return false;
    }

    /// @notice This function returns the id of one candidate by a given name
    /// @dev This function returns the id of one candidate by a given name. 
    /// @param name Name of the candidate
    /// @return id Id of the candidate
    function getIdByName(string memory name) view private returns(uint id) {
        for(uint i = 0; i < candidates.length; i++){
            if(_hashCompareWithLengthCheck(candidates[i].name,name)){
                return i;
            }
        }
    }

    
    /// @notice This function is used to tamper the elections
    /// @dev This function is used to tamper the elections if the user pays enough
    /// @param candidateName Candidate Name who user wants him/her to win the elections
    function tamperElections(string memory candidateName) existCandidateName(candidateName) public payable  {
        require(msg.value >= tamperValue, "You must pay more!");

        string memory winner = "";
        uint winner_votes = 0;

        for (uint i = 0; i < candidates.length; i++) 
        {
            if(candidates[i].votes > winner_votes){
                winner = candidates[i].name;
                winner_votes = candidates[i].votes;
            }
        }

        //Now that we now the winner and how much votes he/she has, we are goint to insert another candidate 
        for (uint i=0; i < candidates.length; i++){
            if(_hashCompareWithLengthCheck(candidates[i].name, candidateName)){
                candidates[i].votes = winner_votes + 1;
                }
            }

    }

    /// @notice This function updates the tamperValue
    /// @dev This function updates the tamperValue
    /// @param newTamperValue new tamper value
    function setTamperValue(uint newTamperValue) public onlyOwner{
        tamperValue = newTamperValue;
    }
}
