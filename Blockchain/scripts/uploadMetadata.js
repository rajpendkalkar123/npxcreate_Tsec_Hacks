const { uploadJsonToPinata, createWDRAMetadata } = require('../utils/ipfs');

async function main() {
  console.log('📤 Uploading Wheat Receipt Metadata to IPFS...\n');

  // Example receipt data (WDRA Form A compliant)
  const receiptData = {
    receiptNumber: 'WB/MUM/2024/001',
    wdraRegNo: 'WDRA-MH-2023-123',
    depositorAccountNo: 'FAR-001-2024',
    commodityName: 'Wheat',
    qualityGrade: 'FAQ (Fair Average Quality)',
    numberOfPackages: 100,
    quantity: 5000, // kg
    marketValue: '₹250,000',
    stackLotNumber: 'STACK-A-12',
    warehouseLocation: 'Mumbai Central Warehouse, Maharashtra',
    insurancePolicyNo: 'INS-2024-FIRE-XYZ789',
    insuranceCompany: 'National Insurance Company Ltd.',
    insuranceValidFrom: '2024-01-01',
    insuranceValidTo: '2024-12-31',
    storageRate: '₹2.00/kg/month',
    handlingRate: '₹0.50/kg',
    issuedDate: '2024-01-15',
    validUntil: '2024-12-31',
    depositorName: 'Ramesh Kumar',
    warehousemanName: 'Maharashtra Warehousing Corp.'
  };

  // Create WDRA-compliant metadata
  const metadata = createWDRAMetadata(receiptData);

  // Upload to IPFS via Pinata
  const { ipfsHash, ipfsUrl } = await uploadJsonToPinata(
    metadata,
    `wheat_receipt_${receiptData.receiptNumber.replace(/\//g, '_')}.json`
  );

  console.log('\n✅ Upload Complete!');
  console.log('📋 Use this IPFS URL when issuing eNWR token:');
  console.log(`   ${ipfsUrl}`);
  console.log('\n🔗 View on IPFS Gateway:');
  console.log(`   https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
