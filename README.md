<a name="readme-top"></a>

<!-- TABLE OF CONTENTS -->
<!-- <details>
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
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details> -->

# DeKino Decentralized Lottery
DeKino is a sample project implementing a smart contract lottery system, developed in the context of the [Full Stack Web3 Development with JavaScript – 32-Hour Course](https://www.youtube.com/watch?v=gyMwXuJrbJQ)

<!-- ABOUT THE PROJECT -->
## About The Project

DeKino was developed using the Hardhat suite to deploy and test the smart contract. It consists of the contract DeKino.sol which allows user to send funds and participate in the lottery draw. The winner will be automatically determined using the Chainlink VRF to get an off-chain random number. Chainlink Keepers is used to trigger the draw automatically based on a time interval if the lottery has at least one participant.

<!-- <p align="right">(<a href="#readme-top">back to top</a>)</p> -->


<!-- 
### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![Vue][Vue.js]][Vue-url]
* [![Angular][Angular.io]][Angular-url]
* [![Svelte][Svelte.dev]][Svelte-url]
* [![Laravel][Laravel.com]][Laravel-url]
* [![Bootstrap][Bootstrap.com]][Bootstrap-url]
* [![JQuery][JQuery.com]][JQuery-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- GETTING STARTED -->
## Getting Started


### Prerequisites

* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [NodeJS](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/getting-started/install) (instead of npm)


### Quickstart

Clone and build the repo
   ```sh
   git clone https://github.com/bpolitiadis/hh-lottery-fcc.git
   cd hh-lottery-fcc
   yarn
   ```
<!-- <p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- USAGE EXAMPLES -->
## Usage

Create a .env file in the root of the project and reference the file .env.example for what needs to be provided.

Deploy:
```sh
yarn hardhat deploy
```
Test:
```sh
yarn hardhat test
```

<!-- <p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- LICENSE -->
## License

Distributed under the MIT License.

<!-- <p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

This project is built for educational purposes only and has been tested only in local enviroment and the Goerli Testnet.


<!-- <p align="right">(<a href="#readme-top">back to top</a>)</p> -->
