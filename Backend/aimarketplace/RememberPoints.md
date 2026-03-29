How Authentication works   using metamask 




    First, the client sends the wallet address to request a nonce.
The backend generates a random nonce and stores it against that wallet.
The frontend asks MetaMask to sign this nonce.
MetaMask returns a signature.
The backend then uses that signature to recover the signer’s address using ECDSA (secp256k1 curve).
If the recovered address matches the provided wallet address, authentication is successful.
Then a JWT token is generated and used for further requests.”





Must known algorithm 

1    ECDSA 
2   Keccak256