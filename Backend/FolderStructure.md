.
├── aimarketplace
│   ├── CurrentIncompleeteBackendPhase.md
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── phase01LeftOverImplementation.md
│   ├── phaseWisePlain.md
│   ├── pom.xml
│   ├── src
│   │   ├── main
│   │   │   ├── java
│   │   │   │   └── com
│   │   │   │       └── aimarketplace
│   │   │   │           └── aimarketplace
│   │   │   │               ├── AimarketplaceApplication.java
│   │   │   │               ├── config
│   │   │   │               │   ├── CorsConfig.java
│   │   │   │               │   └── SecurityConfig.java
│   │   │   │               ├── controller
│   │   │   │               │   ├── AiModalController.java
│   │   │   │               │   └── LoginController.java
│   │   │   │               ├── dto
│   │   │   │               │   ├── request
│   │   │   │               │   │   ├── LoginRequest.java
│   │   │   │               │   │   ├── ModalUploadRequest.java
│   │   │   │               │   │   ├── NonceRequest.java
│   │   │   │               │   │   └── VerifyRequest.java
│   │   │   │               │   └── response
│   │   │   │               │       ├── LoginResponse.java
│   │   │   │               │       └── ModalUploadResponse.java
│   │   │   │               ├── entity
│   │   │   │               │   ├── Role.java
│   │   │   │               │   └── User.java
│   │   │   │               ├── enums
│   │   │   │               │   └── ERole.java
│   │   │   │               ├── repository
│   │   │   │               │   ├── RoleRepository.java
│   │   │   │               │   └── UserRepository.java
│   │   │   │               ├── security
│   │   │   │               │   ├── jwt
│   │   │   │               │   │   ├── JwtAuthFilter.java
│   │   │   │               │   │   └── JwtService.java
│   │   │   │               │   └── UserPrincipal.java
│   │   │   │               └── service
│   │   │   │                   ├── AuthService.java
│   │   │   │                   ├── impl
│   │   │   │                   │   ├── AuthServiceimpl.java
│   │   │   │                   │   └── NonceServiceImpl.java
│   │   │   │                   └── NonceService.java
│   │   │   └── resources
│   │   │       ├── application.yml
│   │   │       ├── static
│   │   │       └── templates
│   │   └── test
│   │       └── java
│   │           └── com
│   │               └── aimarketplace
│   │                   └── aimarketplace
│   │                       ├── AimarketplaceApplicationTests.java
│   │                       └── security
│   │                           └── JwtServiceTest.java
│   └── target
│       ├── classes
│       │   ├── application.properties
│       │   ├── application.yml
│       │   └── com
│       │       └── aimarketplace
│       │           └── aimarketplace
│       │               ├── AimarketplaceApplication.class
│       │               ├── config
│       │               │   ├── CorsConfig.class
│       │               │   └── SecurityConfig.class
│       │               ├── controller
│       │               │   ├── AiModalController.class
│       │               │   └── LoginController.class
│       │               ├── dto
│       │               │   ├── request
│       │               │   │   ├── LoginRequest.class
│       │               │   │   └── ModalUploadRequest.class
│       │               │   └── response
│       │               │       ├── LoginResponse.class
│       │               │       └── ModalUploadResponse.class
│       │               ├── entity
│       │               │   ├── ERole.class
│       │               │   ├── Role.class
│       │               │   └── User.class
│       │               ├── enums
│       │               │   └── ERole.class
│       │               ├── repository
│       │               │   ├── RoleRepository.class
│       │               │   └── UserRepository.class
│       │               ├── security
│       │               │   ├── jwt
│       │               │   │   ├── JwtAuthFilter.class
│       │               │   │   ├── JwtService.class
│       │               │   │   └── JwtUtils.class
│       │               │   └── UserPrincipal.class
│       │               └── service
│       │                   ├── AuthService.class
│       │                   └── impl
│       │                       └── AuthServiceimpl.class
│       ├── generated-sources
│       │   └── annotations
│       ├── generated-test-sources
│       │   └── test-annotations
│       ├── maven-status
│       │   └── maven-compiler-plugin
│       │       ├── compile
│       │       │   └── default-compile
│       │       │       ├── createdFiles.lst
│       │       │       └── inputFiles.lst
│       │       └── testCompile
│       │           └── default-testCompile
│       │               ├── createdFiles.lst
│       │               └── inputFiles.lst
│       ├── surefire-reports
│       │   ├── com.aimarketplace.aimarketplace.AimarketplaceApplicationTests.txt
│       │   ├── com.aimarketplace.aimarketplace.security.jwt.JwtServiceTest.txt
│       │   ├── TEST-com.aimarketplace.aimarketplace.AimarketplaceApplicationTests.xml
│       │   └── TEST-com.aimarketplace.aimarketplace.security.jwt.JwtServiceTest.xml
│       └── test-classes
│           └── com
│               └── aimarketplace
│                   └── aimarketplace
│                       ├── AimarketplaceApplicationTests.class
│                       └── security
│                           ├── jwt
│                           └── JwtServiceTest.class
└── FolderStructure.md

63 directories, 66 files
