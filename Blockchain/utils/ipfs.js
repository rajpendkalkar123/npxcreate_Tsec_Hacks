const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Upload JSON metadata to Pinata IPFS
 * @param {Object} metadata - The metadata object to upload
 * @param {string} name - Name for the pinned file (optional)
 * @returns {Promise<Object>} - Returns { ipfsHash, ipfsUrl }
 */
async function uploadJsonToPinata(metadata, name = 'metadata.json') {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
  const data = {
    pinataContent: metadata,
    pinataMetadata: {
      name: name
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PINATA_JWT}`
  };

  try {
    const response = await axios.post(url, data, { headers });
    const ipfsHash = response.data.IpfsHash;
    const ipfsUrl = `ipfs://${ipfsHash}`;
    
    console.log('✅ Uploaded to IPFS:');
    console.log('   Hash:', ipfsHash);
    console.log('   URL:', ipfsUrl);
    console.log('   Gateway:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    
    return { ipfsHash, ipfsUrl };
  } catch (error) {
    console.error('❌ Error uploading to Pinata:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Upload a file to Pinata IPFS
 * @param {string} filePath - Path to the file to upload
 * @returns {Promise<Object>} - Returns { ipfsHash, ipfsUrl }
 */
async function uploadFileToPinata(filePath) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  
  const formData = new FormData();
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);
  
  formData.append('file', fileStream);
  formData.append('pinataMetadata', JSON.stringify({
    name: fileName
  }));

  const headers = {
    ...formData.getHeaders(),
    'Authorization': `Bearer ${process.env.PINATA_JWT}`
  };

  try {
    const response = await axios.post(url, formData, { 
      headers,
      maxBodyLength: Infinity
    });
    const ipfsHash = response.data.IpfsHash;
    const ipfsUrl = `ipfs://${ipfsHash}`;
    
    console.log('✅ Uploaded file to IPFS:');
    console.log('   File:', fileName);
    console.log('   Hash:', ipfsHash);
    console.log('   URL:', ipfsUrl);
    console.log('   Gateway:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    
    return { ipfsHash, ipfsUrl };
  } catch (error) {
    console.error('❌ Error uploading file to Pinata:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create WDRA Form A compliant metadata
 * @param {Object} receiptData - Receipt data following WDRA Form A structure
 * @returns {Object} - Formatted metadata object
 */
function createWDRAMetadata(receiptData) {
  const {
    receiptNumber,
    wdraRegNo,
    depositorAccountNo,
    commodityName,
    qualityGrade,
    numberOfPackages,
    quantity,
    marketValue,
    stackLotNumber,
    warehouseLocation,
    insurancePolicyNo,
    insuranceCompany,
    insuranceValidFrom,
    insuranceValidTo,
    storageRate,
    handlingRate,
    issuedDate,
    validUntil,
    depositorName,
    warehousemanName,
    imageUrl
  } = receiptData;

  return {
    name: `eNWR - ${commodityName} Receipt #${receiptNumber}`,
    description: `WDRA-compliant Electronic Negotiable Warehouse Receipt for ${quantity}kg of ${commodityName}`,
    image: imageUrl || `ipfs://QmPlaceholder/warehouse_${commodityName.toLowerCase()}.jpg`,
    external_url: `https://croplock.example.com/receipt/${receiptNumber}`,
    attributes: [
      { trait_type: "Receipt Number", value: receiptNumber },
      { trait_type: "WDRA Registration No", value: wdraRegNo },
      { trait_type: "Depositor Account No", value: depositorAccountNo },
      { trait_type: "Commodity Name", value: commodityName },
      { trait_type: "Quality/Grade", value: qualityGrade },
      { trait_type: "No. of Packages", value: numberOfPackages },
      { trait_type: "Quantity (kg)", value: quantity },
      { trait_type: "Market Value at Deposit", value: marketValue },
      { trait_type: "Stack/Lot Number", value: stackLotNumber },
      { trait_type: "Warehouse Location", value: warehouseLocation },
      { trait_type: "Insurance Policy No", value: insurancePolicyNo },
      { trait_type: "Insurance Company", value: insuranceCompany },
      { trait_type: "Insurance Valid From", value: insuranceValidFrom },
      { trait_type: "Insurance Valid To", value: insuranceValidTo },
      { trait_type: "Storage Rate", value: storageRate },
      { trait_type: "Handling Rate", value: handlingRate },
      { trait_type: "Receipt Issued Date", value: issuedDate },
      { trait_type: "Valid Until", value: validUntil },
      { trait_type: "Depositor Name", value: depositorName },
      { trait_type: "Warehouseman Name", value: warehousemanName }
    ]
  };
}

module.exports = {
  uploadJsonToPinata,
  uploadFileToPinata,
  createWDRAMetadata
};
