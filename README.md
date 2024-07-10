# DiGo Certify

<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
![GitHub repo size](https://img.shields.io/github/repo-size/DiGo-Certify/DiGo-certify-app)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/DiGo-Certify/DiGo-certify-app/cl.yml)
![GitHub License](https://img.shields.io/github/license/DiGo-Certify/DiGo-certify-app)

---

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/DiGo-Certify/DiGo-certify-app/blob/main/docs/images/logo.png">
    <img src="docs/images/splash-screen.png" alt="Logo">
  </a>

<h3 align="center">SCAR: A Blockchain based approach for academic registry</h3>

  <p align="center">
    Academic certificates registry on blockchain for secure and tamper-proof verification.
    <br />
    <a href="https://github.com/DiGo-Certify/DiGo-certify-app"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/DiGo-Certify/DiGo-certify-app">View Demo</a>
    ·
    <a href="https://github.com/DiGo-Certify/DiGo-certify-app/issues">Report Bug</a>
    ·
    <a href="https://github.com/DiGo-Certify/DiGo-certify-app/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

[![Block Chain and Smart Contracts][product-screenshot]][product-screenshot]

SCAR, **S**mart **C**ontract **A**cademic **R**egistry is a multiplatform application that allows a entity to register academic certificates on a blockchain, and allows a third party to verify the authenticity of the certificate.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![Node][Node.js]][Node-url]
- [![React Native][ReactNative.js]][ReactNative-url]
- [![Expo React Native][Expo.js]][Expo-url]
- [![Smart Contract][Solidity.sol]][Solidity-url]
- [![Hardhat][Hardhat.js]][Hardhat-url]
- [![Ethereum][Ethereum.js]][Ethereum-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

We need to install the DiGo Certify app on your device.
The following instructions will guide you through the installation process.

### Prerequisites

1. You need to have node do run the application.

- npm
  ```sh
  npm install npm@latest -g
  ```
2. Install Expo Go on your smart phone:
  - **IOS**: https://apps.apple.com/us/app/expo-go/id982107779
  - **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent&hl=en


### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/DiGo-Certify/DiGo-certify-app.git && \
   cd DiGo-certify-app/code/
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Deploy the initial smart contract onto the blockchain
   ```sh
   npm run deploy
   ```
4. Run the app
   ```sh
    npx expo start
    ```
5. Scan the QR Code provided on your smart phone to run the app

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

<!-- ## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_

<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- LICENSE -->

## License

Distributed under the GNU GENERAL PUBLIC LICENSE License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

:inbox_tray: Diogo Rodrigues(developer) - [a49513@alunos.isel.pt](mailto:a49513@alunos.isel.pt)

:inbox_tray: Gonçalo Frutuoso(developer) - [a49495@alunos.isel.pt](mailto:a49495@alunos.isel.pt)

:inbox_tray: Cátia Vaz(supervisor) - [cvaz@isel.pt](mailto:cvaz@isel.pt)

:inbox_tray: Alexandre Francisco(supervisor) - [aplf@tecnico.pt](mailto:aplf@tecnico.pt)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

<!-- ## Acknowledgments

- []()
- []()
- []() -->

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[contributors-shield]: https://img.shields.io/github/contributors/DiGo-Certify/DiGo-certify-app.svg
[contributors-url]: https://github.com/DiGo-Certify/DiGo-certify-app/graphs/contributors
[product-screenshot]: ./docs/images/blockchain-and-smart-contract-image.png
[Node.js]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[Expo.js]: https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37
[Expo-url]: https://docs.expo.dev/
[Solidity.sol]: https://img.shields.io/badge/solidity-363636?style=for-the-badge&logo=solidity&logoColor=white
[Solidity-url]: https://docs.soliditylang.org/en/v0.8.7/
[Hardhat.js]: https://img.shields.io/badge/hardhat-000000?style=for-the-badge&logo=hardhat&logoColor=white
[Hardhat-url]: https://hardhat.org/
[Ethereum.js]: https://img.shields.io/badge/ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white
[Ethereum-url]: https://ethereum.org/en/
[FireBase.js]: https://img.shields.io/badge/firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black
[FireBase-url]: https://firebase.google.com/
[TypeScript.ts]: https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[ReactNative.js]: https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB
[ReactNative-url]: https://reactnative.dev/
