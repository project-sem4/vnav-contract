## Bước 1
- Tạo 1 file .env giống file .env.example
- chạy npm install
- chạy npm run compile để biên dịch smart contract
- chạy npm run test để chạy test
- chạy `npm run deploy bsctest`  để deploy smart contract lên mạng bsctest
- verify (có thể bỏ qua )
  - Verify erc20: ` npm run verify bsctest -- --contract contracts/BOToken.sol:BoToken 0x....` thay 0x.... bằng địa chỉ contract erc20 đã được deploy ở bước trên xem file config.json hoặc đọc logs 
  - verify BO `npx hardhat verify --network bsctest --contract contracts/BO.sol:BOContract 0xA4411B09F78B4d3D49C37c16188FdAe3748cd4f8 0x2FAD4f186e8174ab18741b09ED419D6d12Fa29F3
` địa chỉ contract BO đã được deploy ở bước trên xem file config.json hoặc đọc logs địa chỉ contract erc20 đã được deploy ở bước trên xem file config.json hoặc đọc logsc