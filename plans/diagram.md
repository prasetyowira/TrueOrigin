# TrueOrigin Authentication Flow Diagram

```mermaid
flowchart TD
    %% Define actors
    subgraph User
        A[User visits login page]
        B[Select role: Brand Owner/Reseller]
        C[Complete Internet Identity auth]
        D1[Fill brand owner form]
        D2[Select organization]
        D3[Fill reseller form]
    end

    subgraph Frontend
        E[Show login page with role options]
        F[Initiate Internet Identity auth]
        G[Process authentication]
        H[Check user role & organization status]
        I1[Show brand owner organization form]
        I2[Show organization selection dialog]
        I3[Show reseller registration form]
        J1[Create organization]
        J2[Select active organization]
        J3[Register as reseller]
        K1[Redirect to brand owner dashboard]
        K2[Redirect to reseller certification]
        L[Display debug logs]
    end

    subgraph Backend
        M[Get available roles]
        N[Register user with role]
        O[Get auth context]
        P1[Create organization with context]
        P2[Get user organizations]
        P3[Select active organization]
        P4[Register as reseller enhanced]
        P5[Get reseller certification context]
        Q[Get user profile context]
    end

    subgraph InternetIdentity [Internet Identity]
        R[Authentication process]
        S[Generate identity]
    end

    %% Define flow
    A --> E
    E --> M
    M --> E
    E --> B
    B --> F
    F --> R
    R --> S
    S --> G
    G --> N
    N --> O
    O --> H
    
    %% Decision points for next steps based on role and org status
    H -->|Brand Owner, No Orgs| I1
    H -->|Brand Owner, Multiple Orgs| I2
    H -->|Brand Owner, Single Org| K1
    H -->|Reseller, Not Registered| I3
    H -->|Reseller, Registered| K2
    
    %% Brand Owner flow
    I1 --> D1
    D1 --> J1
    J1 --> P1
    P1 --> K1
    
    I2 --> P2
    P2 --> I2
    I2 --> D2
    D2 --> J2
    J2 --> P3
    P3 --> K1
    
    K1 --> Q
    
    %% Reseller flow
    I3 --> P2
    P2 --> I3
    I3 --> D3
    D3 --> J3
    J3 --> P4
    P4 --> K2
    K2 --> P5
    P5 --> K2
    
    %% Debugging
    G -.-> L
    H -.-> L
    J1 -.-> L
    J2 -.-> L
    J3 -.-> L
    
    %% Define styles
    classDef userAction fill:#d0f0c0,stroke:#333,stroke-width:1px;
    classDef frontendAction fill:#b0e0e6,stroke:#333,stroke-width:1px;
    classDef backendAction fill:#ffe4b5,stroke:#333,stroke-width:1px;
    classDef iiAction fill:#e6e6fa,stroke:#333,stroke-width:1px;
    classDef debugAction fill:#ffb6c1,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;

    %% Apply styles
    class A,B,C,D1,D2,D3 userAction;
    class E,F,G,H,I1,I2,I3,J1,J2,J3,K1,K2 frontendAction;
    class M,N,O,P1,P2,P3,P4,P5,Q backendAction;
    class R,S iiAction;
    class L debugAction;
```

## Sequence Diagram for Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant II as Internet Identity
    
    %% Initial load and role selection
    User->>Frontend: Visit login page
    Frontend->>Backend: get_available_roles()
    Backend-->>Frontend: Return roles
    Frontend->>User: Display role options
    User->>Frontend: Select role (BrandOwner/Reseller)
    
    %% Authentication
    Frontend->>II: Initiate authentication
    II->>User: Show login prompt
    User->>II: Provide credentials
    II-->>Frontend: Return identity
    Frontend->>Backend: register_with_role(role)
    Backend-->>Frontend: Return user data
    
    %% Role-based flow determination
    Frontend->>Backend: get_auth_context()
    Backend-->>Frontend: Return auth context
    
    %% Conditional flows based on role and status
    alt Brand Owner with no organizations
        Frontend->>User: Show organization form
        User->>Frontend: Submit organization details
        Frontend->>Backend: create_organization_with_context()
        Backend-->>Frontend: Return organization data
        Frontend->>User: Redirect to dashboard
    else Brand Owner with multiple organizations
        Frontend->>Backend: get_user_organizations()
        Backend-->>Frontend: Return organizations list
        Frontend->>User: Show organization selection
        User->>Frontend: Select organization
        Frontend->>Backend: select_active_organization()
        Backend-->>Frontend: Return updated context
        Frontend->>User: Redirect to dashboard
    else Reseller not registered
        Frontend->>Backend: get_user_organizations() for selection
        Backend-->>Frontend: Return organizations list
        Frontend->>User: Show reseller registration form
        User->>Frontend: Submit reseller details
        Frontend->>Backend: register_as_reseller_enhanced()
        Backend-->>Frontend: Return registration result
        Frontend->>User: Redirect to certification
    else Reseller registered
        Frontend->>Backend: get_reseller_certification_context()
        Backend-->>Frontend: Return certification data
        Frontend->>User: Show certification info
    end
    
    %% Debug logging throughout flow
    Note over Frontend: Debug logs captured at each step
```

## State Diagram for User Authentication States

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> RoleSelected: Select Role
    RoleSelected --> Authenticated: Internet Identity Auth
    
    state Authenticated {
        [*] --> CheckingStatus
        CheckingStatus --> BrandOwnerFlow: Role is BrandOwner
        CheckingStatus --> ResellerFlow: Role is Reseller
        
        state BrandOwnerFlow {
            [*] --> BrandOwnerNoOrg: No organizations
            [*] --> BrandOwnerMultiOrg: Multiple organizations
            [*] --> BrandOwnerReady: Single organization
            
            BrandOwnerNoOrg --> CreatingOrganization
            CreatingOrganization --> BrandOwnerReady
            
            BrandOwnerMultiOrg --> SelectingOrganization
            SelectingOrganization --> BrandOwnerReady
        }
        
        state ResellerFlow {
            [*] --> ResellerNotRegistered: Not registered
            [*] --> ResellerRegistered: Already registered
            
            ResellerNotRegistered --> RegisteringReseller
            RegisteringReseller --> ResellerRegistered
        }
    }
    
    BrandOwnerReady --> BrandOwnerDashboard
    ResellerRegistered --> ResellerCertification
    
    state BrandOwnerDashboard {
        [*] --> ViewingProducts
        ViewingProducts --> ManagingProducts
        ManagingProducts --> ViewingProducts
    }
    
    state ResellerCertification {
        [*] --> ViewingCertification
        ViewingCertification --> SharingCertification
    }
```

## Use Case Diagram

```mermaid
graph TD
    %% Define actors
    A((User))
    B((Admin))
    II((Internet Identity))
    
    %% Define use cases
    UC1[Select User Role]
    UC2[Authenticate with II]
    UC3[Create Brand Organization]
    UC4[Select Brand Organization]
    UC5[Register as Reseller]
    UC6[View Brand Dashboard]
    UC7[Manage Products]
    UC8[View Reseller Certification]
    UC9[Share Certification]
    UC10[Administer System]
    UC11[Verify Resellers]
    UC12[Manage Authentication]
    
    %% Define relationships
    A --- UC1
    A --- UC2
    A --- UC3
    A --- UC4
    A --- UC5
    A --- UC6
    A --- UC7
    A --- UC8
    A --- UC9
    
    B --- UC10
    B --- UC11
    B --- UC3
    B --- UC7
    
    II --- UC2
    II --- UC12
    
    %% Define dependencies
    UC2 -.-> UC1
    UC3 -.-> UC2
    UC4 -.-> UC2
    UC5 -.-> UC2
    UC6 -.-> UC3
    UC6 -.-> UC4
    UC7 -.-> UC6
    UC8 -.-> UC5
    UC9 -.-> UC8
    UC11 -.-> UC10
    
    %% Define styles
    classDef actor fill:#f9f,stroke:#333,stroke-width:2px;
    classDef usecase fill:#bbf,stroke:#333,stroke-width:1px;
    classDef dependency stroke:#999,stroke-width:1px,stroke-dasharray: 5 5;
    
    class A,B,II actor;
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12 usecase;
```

## Detailed Activity Diagram

```mermaid
flowchart TD
    %% Start
    Start([Start]) --> A1[User Visits Login Page]
    
    %% Role Selection Phase
    A1 --> A2{Select Role}
    A2 -->|Brand Owner| A3[Select Brand Owner Role]
    A2 -->|Reseller| A4[Select Reseller Role]
    A2 -->|Admin| A5[Select Admin Role]
    
    %% Authentication Phase
    A3 --> A6[Trigger II Authentication]
    A4 --> A6
    A5 --> A6
    
    A6 --> A7{Valid II Auth?}
    A7 -->|No| A8[Show Auth Error]
    A8 --> A1
    
    A7 -->|Yes| A9[Register User with Selected Role]
    A9 --> A10[Get Authentication Context]
    
    %% Post-Auth Decision Making
    A10 --> A11{Check Role & Status}
    
    %% Brand Owner Flow
    A11 -->|Brand Owner, No Orgs| B1[Show Brand Organization Form]
    B1 --> B2[User Fills Organization Details]
    B2 --> B3[Submit Organization]
    B3 --> B4[Create Organization in Backend]
    B4 --> B5{Creation Successful?}
    B5 -->|No| B6[Show Error]
    B6 --> B1
    B5 -->|Yes| B7[Navigate to Brand Dashboard]
    
    A11 -->|Brand Owner, Multiple Orgs| C1[Fetch User Organizations]
    C1 --> C2[Show Organization Selection Dialog]
    C2 --> C3[User Selects Organization]
    C3 --> C4[Set Active Organization in Backend]
    C4 --> C5{Selection Successful?}
    C5 -->|No| C6[Show Error]
    C6 --> C2
    C5 -->|Yes| B7
    
    A11 -->|Brand Owner, Single Org| B7
    
    %% Reseller Flow
    A11 -->|Reseller, Not Registered| D1[Show Reseller Registration Form]
    D1 --> D2[User Fills Reseller Details]
    D2 --> D3[Submit Reseller Registration]
    D3 --> D4[Register Reseller in Backend]
    D4 --> D5{Registration Successful?}
    D5 -->|No| D6[Show Error]
    D6 --> D1
    D5 -->|Yes| D7[Navigate to Certification Page]
    
    A11 -->|Reseller, Registered| D7
    
    %% Admin Flow
    A11 -->|Admin| E1[Navigate to Admin Dashboard]
    
    %% Brand Dashboard Activities
    B7 --> F1[Load Product Data]
    F1 --> F2[Display Brand Dashboard]
    F2 --> F3[User Interacts with Dashboard]
    F3 --> F4{User Action?}
    F4 -->|Manage Products| F5[Show Product Management]
    F5 --> F3
    F4 -->|View Analytics| F6[Show Analytics Dashboard]
    F6 --> F3
    F4 -->|Logout| F7[Perform Logout]
    F7 --> A1
    
    %% Certification Activities
    D7 --> G1[Load Certification Data]
    G1 --> G2[Display Certification Details]
    G2 --> G3[User Interacts with Certification]
    G3 --> G4{User Action?}
    G4 -->|Share Certification| G5[Generate Shareable Link]
    G5 --> G3
    G4 -->|Download Certificate| G6[Download Certificate PDF]
    G6 --> G3
    G4 -->|Logout| F7
    
    %% Styling
    classDef start fill:#58FF33,stroke:#333,stroke-width:2px;
    classDef process fill:#87CEFA,stroke:#333,stroke-width:1px;
    classDef decision fill:#FFD700,stroke:#333,stroke-width:1px;
    classDef terminal fill:#FF6347,stroke:#333,stroke-width:1px;
    
    class Start start;
    class A1,A3,A4,A5,A6,A8,A9,A10,B1,B2,B3,B4,B6,B7,C1,C2,C3,C4,C6,D1,D2,D3,D4,D6,D7,E1,F1,F2,F3,F5,F6,F7,G1,G2,G3,G5,G6 process;
    class A2,A7,A11,B5,C5,D5,F4,G4 decision;
```

## Data Flow Diagram

```mermaid
flowchart TD
    %% External Entities
    User([User])
    II([Internet Identity])
    
    %% Processes
    P1(("1. Authentication\nProcess"))
    P2(("2. Role\nManagement"))
    P3(("3. User\nRegistration"))
    P4(("4. Organization\nManagement"))
    P5(("5. Reseller\nRegistration"))
    P6(("6. Dashboard\nManagement"))
    P7(("7. Certification\nManagement"))
    
    %% Data Stores
    DS1[(User DB)]
    DS2[(Organization DB)]
    DS3[(Role Permissions)]
    DS4[(Reseller DB)]
    DS5[(Certification DB)]
    DS6[(Debug Logs)]
    
    %% Data Flows - User to Processes
    User -->|Role Selection| P2
    User -->|Authentication Credentials| P1
    User -->|Organization Details| P4
    User -->|Reseller Information| P5
    User -->|Dashboard Interactions| P6
    User -->|Certification Requests| P7
    
    %% Data Flows - Internet Identity
    II -->|Identity Token| P1
    P1 -->|Authentication Request| II
    
    %% Data Flows - Authentication Process
    P1 -->|Authentication Result| P3
    P1 -->|User Identity| DS1
    P1 -->|Debug Information| DS6
    
    %% Data Flows - Role Management
    P2 -->|Role Assignment| P3
    P2 -->|Role Information| DS1
    P2 <-->|Role Permissions| DS3
    
    %% Data Flows - User Registration
    P3 -->|Store User Data| DS1
    P3 -->|User Context| P4
    P3 -->|User Context| P5
    P3 -->|User Profile| P6
    P3 -->|Registration Logs| DS6
    
    %% Data Flows - Organization Management
    P4 <-->|Organization Data| DS2
    P4 -->|Organization Context| P6
    P4 -->|Organization Selection| DS1
    P4 -->|Organization Logs| DS6
    
    %% Data Flows - Reseller Registration
    P5 -->|Reseller Data| DS4
    P5 <-->|Organization Reference| DS2
    P5 -->|Generate Certification| P7
    P5 -->|Reseller Logs| DS6
    
    %% Data Flows - Dashboard Management
    P6 <-->|User Profile| DS1
    P6 <-->|Organization Data| DS2
    P6 -->|Dashboard Logs| DS6
    
    %% Data Flows - Certification Management
    P7 <-->|Certification Data| DS5
    P7 <-->|Reseller Verification| DS4
    P7 -->|Certification Context| User
    P7 -->|Certification Logs| DS6
    
    %% Process to User Data Flows
    P3 -->|Authentication Response| User
    P4 -->|Organization List/Details| User
    P5 -->|Registration Confirmation| User
    P6 -->|Dashboard Data| User
    P7 -->|Certification Data| User
    
    %% Styling
    classDef entity fill:#f9f,stroke:#333,stroke-width:2px;
    classDef process fill:#7eb0d5,stroke:#333,stroke-width:1px,border-radius:50px;
    classDef datastore fill:#ffb347,stroke:#333,stroke-width:1px;
    classDef dataflow stroke:#333,stroke-width:1px;
    
    class User,II entity;
    class P1,P2,P3,P4,P5,P6,P7 process;
    class DS1,DS2,DS3,DS4,DS5,DS6 datastore;
```
