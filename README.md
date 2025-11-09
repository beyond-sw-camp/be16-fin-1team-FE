# Orbit(오르빗)

> 모든 일정/협업을 하나로! 캘린더·간트·마일스톤·칸반·채팅·문서를 **실시간으로 연동**하는 애자일 기반 통합 프로젝트 플랫폼
> <p align="center">
</p>
<img width="2400" height="800" alt="image" src="https://github.com/user-attachments/assets/045e5ea7-5171-485d-880d-3e9c2110e06a" />

## 👀 팀원 구성
<table>
  <tr>
    <!-- 1행: 사진(클릭 가능) + 이름 -->
    <td align="center">
      <a href="https://github.com/EunDuk2" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/124436476?v=4" width="100px;" alt="조은성"/>
      </a><br />
      <b>조은성</b>
    </td>
        <td align="center">
      <a href="https://github.com/YoungKwanK" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/154659797?v=4" width="100px;" alt="김영관"/>
      </a><br />
      <b>김영관</b>
    </td>
    <td align="center">
      <a href="https://github.com/jominhyeong97" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/206010512?v=4" width="100px;" alt="조민형"/>
      </a><br />
      <b>조민형</b>
    </td>
    <td align="center">
      <a href="https://github.com/ifunhy" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/194198612?v=4" width="100px;" alt="김현지"/>
      </a><br />
      <b>김현지</b>
    </td>
    <td align="center">
      <a href="https://github.com/rm2001kr" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/207882668?v=4" width="100px;" alt="김강산"/>
      </a><br />
      <b>김강산</b>
    </td>
  </tr>
  <tr>
    <!-- 2행: GitHub 배지 -->
    <td align="center">
      <a href="https://github.com/EunDuk2" target="_blank">
        <img src="https://img.shields.io/badge/GitHub_Profile-181717?style=flat-square&logo=github&logoColor=white"/>
      </a>
    </td>
        <td align="center">
      <a href="https://github.com/YoungKwanK" target="_blank">
        <img src="https://img.shields.io/badge/GitHub_Profile-181717?style=flat-square&logo=github&logoColor=white"/>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/jominhyeong97" target="_blank">
        <img src="https://img.shields.io/badge/GitHub_Profile-181717?style=flat-square&logo=github&logoColor=white"/>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ifunhy" target="_blank">
        <img src="https://img.shields.io/badge/GitHub_Profile-181717?style=flat-square&logo=github&logoColor=white"/>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/rm2001kr" target="_blank">
        <img src="https://img.shields.io/badge/GitHub_Profile-181717?style=flat-square&logo=github&logoColor=white"/>
      </a>
    </td>
  </tr>
</table>

<br/>

## 📖 배경 및 필요성
현대 협업 환경은 Jira, Slack, Notion 등 기능별 SaaS 사용이 보편화되면서 **정보가 파편화**되고 잦은 **컨텍스트 전환**이 발생하는 문제를 겪고 있습니다. 또한, 기존 툴의 복잡한 UI는 사용자의 피로도를 가중시킵니다.

본 프로젝트는 이러한 파편화된 협업 기능을 **단일 플랫폼에 통합**하고, 사용자 친화적인 UI/UX를 제공하여 생산성 저하 문제를 해결하고자 합니다.

핵심 목표는 **마일스톤**(목표 추적), **간트 차트**(작업 흐름), **캘린더**(일정 관리) 기능을 유기적으로 연동하는 것입니다. 하나의 변경 사항이 모든 관련 기능에 **실시간 동기화**되도록 하여, 팀원 누구나 통일된 데이터를 기반으로 프로젝트 전체 흐름을 한눈에 파악하는 효율적인 협업 환경을 구축하는 것을 목표로 합니다.

<br/>

## ✨ 주요 기능

### 1) 📅 통합 일정 관리
- 개인/프로젝트/팀 **통합 캘린더** (월/주/일 뷰)
- 일정 상태/중요도 색상 구분, 날짜 클릭 상세/수정
- **간트 차트·마일스톤과 양방향 연동**, To-Do(개인 작업)까지 한 화면에서

### 2) ⏰ 체계적인 알림
- 마감/회의 등 **예약 알림** (예: 1일 전, 15분 전)
- WebSocket/SSE 기반 **실시간 동기화**
- 워크스페이스/프로젝트/스톤/태스크 **메타데이터 포함 푸시**

### 3) 🛠 스크럼 & 칸반
- 스프린트·태스크·이슈를 **칸반 보드**로 관리
- 진행률/리드타임 등 생산성 지표 시각화

### 4) 💬 실시간 채팅·피드백
- 워크스페이스/프로젝트 **전용 채팅방 자동 개설(옵션)**
- 멘션·명령어·파일 공유, 메시지 내 날짜 → **캘린더 일정 등록**

### 5) 📝 실시간 공동 작성
- 문서/회의록 **동시 편집**, 변경사항 실시간 반영
- 회의 **녹화 및 AI 자동 회의록 요약**

### 6) 🤖 AI 어시스턴트
- 사전 회의 주제 기반 자료 추천
- 회의록/채팅 요약, 태스크 추출

<br/>

## 📋 프로젝트 산출물

| 구분 | 링크 |
| :--- | :--- |
| **Figma** | [🔗 Figma 디자인 보기](https://www.figma.com/design/f8NVDb2aljFlzoDFRRo8bl/Orbit?node-id=0-1&p=f&t=sfF5y7Eb2MaNDDP3-0) |
| **API 명세서** | [🔗 API 명세서 보기](https://docs.google.com/spreadsheets/d/1GIcKtK_Tk5H-6UdCrks_X5xXr9MtWWH2bNvIPpIW59k/edit?gid=1634200920#gid=1634200920) |
| **WBS** | [🔗 WBS 보기](https://docs.google.com/spreadsheets/d/1GIcKtK_Tk5H-6UdCrks_X5xXr9MtWWH2bNvIPpIW59k/edit?gid=2008137453#gid=2008137453) |
| **요구사항 명세서** | [🔗 요구사항 명세서 보기](https://docs.google.com/spreadsheets/d/1GIcKtK_Tk5H-6UdCrks_X5xXr9MtWWH2bNvIPpIW59k/edit?gid=0#gid=0) |

<br/>

## 🧱 ERD

  <img width="5240" height="2943" alt="Final-Dolmeng-E-msa (1)" src="https://github.com/user-attachments/assets/c36920e1-2bee-41e5-bc56-be1aeb23153d" />


<br/>


## 기능 화면

<details id="home">
  <summary><b>🏠 홈</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/home.png" alt="Orbit Home" width="100%"/>
  </p>
</details>

<details id="my-schedule">
  <summary><b>📅 내일정</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/schedule.png" alt="Orbit Calendar" width="100%"/>
  </p>
</details>

<details id="messenger">
  <summary><b>💬 메신저</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/messenger.png" alt="Orbit Messenger" width="100%"/>
  </p>
</details>

<details id="drive">
  <summary><b>📁 문서함</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/drive.png" alt="Orbit Drive" width="100%"/>
  </p>
</details>

<details id="project">
  <summary><b>🗂 프로젝트</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/project.png" alt="Orbit Project" width="100%"/>
  </p>
</details>

<details id="admin">
  <summary><b>🛠 관리자페이지</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/admin.png" alt="Orbit Admin" width="100%"/>
  </p>
</details>

<details id="mypage">
  <summary><b>👤 마이페이지</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/mypage.png" alt="Orbit My Page" width="100%"/>
  </p>
</details>

<details id="chatbot">
  <summary><b>🤖 챗봇</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/chatbot.png" alt="Orbit Chatbot" width="100%"/>
  </p>
</details>

<details id="search">
  <summary><b>🔎 검색</b></summary>
  <br/>
  <p align="center">
    <img src="./assets/features/search.png" alt="Orbit Search" width="100%"/>
  </p>
</details>

<!-- ===== /Feature Toggle Gallery ===== -->



## 🏗️ 시스템 아키텍처
<details>
  <summary><b>시스템 아키텍처 보기</b></summary>
</details>
  

<br/>

## ⚒️ 기술 스택

**Frontend**  
![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFB300?style=for-the-badge&logo=pinia&logoColor=black)
![Vue Router](https://img.shields.io/badge/Vue_Router-4FC08D?style=for-the-badge&logo=vuerouter&logoColor=white)
![Vuetify](https://img.shields.io/badge/Vuetify-1867C0?style=for-the-badge&logo=vuetify&logoColor=white)
![MDI](https://img.shields.io/badge/MDI-000000?style=for-the-badge&logo=materialdesignicons&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![FullCalendar](https://img.shields.io/badge/FullCalendar-3178C6?style=for-the-badge&logo=fullcalendar&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![ApexCharts](https://img.shields.io/badge/ApexCharts-008FFB?style=for-the-badge&logo=apexcharts&logoColor=white)
![Vue Flow](https://img.shields.io/badge/Vue_Flow-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Tiptap](https://img.shields.io/badge/Tiptap-000000?style=for-the-badge&logo=tiptap&logoColor=white)
![ProseMirror](https://img.shields.io/badge/ProseMirror-000000?style=for-the-badge&logo=prosemirror&logoColor=white)
![STOMP.js](https://img.shields.io/badge/STOMP.js-grey?style=for-the-badge&logo=websocket&logoColor=white)
![SockJS](https://img.shields.io/badge/SockJS-grey?style=for-the-badge&logo=javascript&logoColor=white)
![OpenVidu](https://img.shields.io/badge/OpenVidu-273A8B?style=for-the-badge&logo=openvidu&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Docx](https://img.shields.io/badge/docx-2B579A?style=for-the-badge&logo=microsoftword&logoColor=white)
![Lodash](https://img.shields.io/badge/Lodash-3492FF?style=for-the-badge&logo=lodash&logoColor=white)
![UUID](https://img.shields.io/badge/UUID-grey?style=for-the-badge)
![Core-JS](https://img.shields.io/badge/Core_JS-F7E018?style=for-the-badge&logo=javascript&logoColor=black)
![File Saver](https://img.shields.io/badge/File_Saver-blue?style=for-the-badge)


**Backend**  
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Spring WebFlux](https://img.shields.io/badge/Spring_WebFlux-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Spring Cloud Gateway](https://img.shields.io/badge/Spring_Cloud_Gateway-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Netflix Eureka](https://img.shields.io/badge/Netflix_Eureka-6DB33F?style=for-the-badge&logo=netflix&logoColor=white)
![OpenFeign](https://img.shields.io/badge/OpenFeign-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Resilience4j](https://img.shields.io/badge/Resilience4j-8A2BE2?style=for-the-badge)
<br>
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white)
![STOMP](https://img.shields.io/badge/STOMP-grey?style=for-the-badge)
![OpenVidu](https://img.shields.io/badge/OpenVidu-273A8B?style=for-the-badge&logo=openvidu&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
<br>
![Lombok](https://img.shields.io/badge/Lombok-000000?style=for-the-badge&logo=lombok&logoColor=white)
![Jackson](https://img.shields.io/badge/Jackson-grey?style=for-the-badge)
![Apache Tika](https://img.shields.io/badge/Apache_Tika-D22128?style=for-the-badge&logo=apache&logoColor=white)
![JSoup](https://img.shields.io/badge/JSoup-FF9900?style=for-the-badge)
![Apache HttpClient](https://img.shields.io/badge/Apache_HttpClient-D22128?style=for-the-badge&logo=apache&logoColor=white)

**Database**  
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Redis Stack](https://img.shields.io/badge/Redis_Stack-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white)

**Deployment & DevOps**  
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-1A1A1A?style=for-the-badge&logo=n8n&logoColor=white)
<br>
![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)
![Maven Central](https://img.shields.io/badge/Maven_Central-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)
![GitHub Packages](https://img.shields.io/badge/GitHub_Packages-000000?style=for-the-badge&logo=github&logoColor=white)

**Collaboration & Tools**

![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![Asana](https://img.shields.io/badge/Asana-8D8D8D?style=for-the-badge&logo=asana&logoColor=white)
![ERDCloud](https://img.shields.io/badge/ERDCloud-0099FF?style=for-the-badge&logo=erdcloud&logoColor=white)


<br/>

## 📝 프로젝트 회고

| 팀원 | 회고 내용 |
|------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 조은성 |  |
| 김영관 |  |
| 조민형 |  |
| 김현지 |  |
| 김강산 |  |

