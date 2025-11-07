<!-- Project Hero -->
<p align="center">
  <img src="./assets/orbit-hero.svg" alt="Orbit – Agile Project & Calendar Platform" width="100%">
</p>

<p align="center">
  <a href="https://www.orbitflow.store"><b>📆 ORBIT 바로가기</b> — https://www.orbitflow.store</a>
</p>

---

# Orbit(오르빗)

> 모든 일정/협업을 하나로! 캘린더·간트·마일스톤·칸반·채팅·문서를 **실시간으로 연동**하는 애자일 기반 통합 프로젝트 플랫폼

![캘릿 배경](https://github.com/user-attachments/assets/fc9a224e-d6c7-4836-b4b4-f7f6f0a67b18)

## 👀 팀원 구성
- 조은성 — https://github.com/EunDuk2  
- 조민형 — https://github.com/jominhyeong97  
- 김현지 — https://github.com/ifunhy  
- 김영관 — https://github.com/YoungKwanK  

<br/>

## 📖 배경 및 필요성
현대 협업 환경은 Jira, Slack, Notion 등 기능별 SaaS로 분절되어 잦은 컨텍스트 전환과 정보 파편화가 발생합니다.  
**Orbit**은 캘린더/간트/마일스톤/칸반/채팅/문서 협업을 하나의 UX로 통합하고, 변경을 **실시간으로 전 모듈에 연동**하여
누구나 **통일된 데이터**로 프로젝트 전반을 한눈에 파악하고 효율적으로 협업할 수 있도록 설계했습니다.

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

## 🔗 문서 & 링크
- 🎨 화면설계서(Figma): https://www.figma.com/design/V59MNrd8govUfzrRPHeKZa/Wireframe?node-id=24-58463&node-type=canvas&t=wSgc72pyUcR52dun-0
- 💌 API 명세서(Notion): https://tropical-ferry-82d.notion.site/API-33445269d61e4c0183bcecd43e44ee61?pvs=74
- 🌐 ORBIT: https://www.orbitflow.store

<br/>

## 🧱 ERD
<details>
  <summary><b>ERD 보기</b></summary>

  ![CalIT_v2 ERD](https://github.com/user-attachments/assets/db0e189b-f9f6-486a-87f6-96b50d10d6ca)

  <div style="border:1px solid #ccc; padding:10px; width: 250px; font-size: 12px; margin-top: 10px;">
    <b>🔍 ERD 색상</b><br>
    🧡 유저 / 🩷 스크럼 / 💛 알람 / 💙 채팅 / 💜 챗봇 / 💚 게시판
  </div>
</details>

<br/>

## 🏗️ 시스템 아키텍처
<details>
  <summary><b>시스템 아키텍처 보기</b></summary>

  ![CalIT_시스템 아키텍처_V2](https://github.com/user-attachments/assets/5edb89af-c3fa-4db7-bfd8-4690a3d0c065)
</details>

<br/>

## ⚒️ 기술 스택

**Frontend**  
<img src="https://img.shields.io/badge/Vue.js-181717?style=flat&logo=Vue.js&logoColor=4FC08D&color=white"> <img src="https://img.shields.io/badge/HTML5-181717?style=flat&logo=html5&logoColor=E34F26&color=white"> <img src="https://img.shields.io/badge/CSS3-181717?style=flat&logo=css3&logoColor=1572B6&color=white"> <img src="https://img.shields.io/badge/JavaScript-181717?style=flat&logo=javascript&logoColor=F7DF1E&color=white"> <img src="https://img.shields.io/badge/Nginx-181717?style=flat&logo=nginx&logoColor=009639&color=white"> <img src="https://img.shields.io/badge/Axios-181717?style=flat&logo=axios&logoColor=5A29E4&color=white"> <img src="https://img.shields.io/badge/Pinia-181717?style=flat&logo=pinia&logoColor=FEDD00&color=white">

**Backend**  
<img src="https://img.shields.io/badge/SpringBoot-181717?style=flat&logo=SpringBoot&logoColor=6DB33F&color=white"> <img src="https://img.shields.io/badge/Spring_Security-181717?style=flat&logo=SpringSecurity&logoColor=6DB33F&color=white"> <img src="https://img.shields.io/badge/JSON_Web_Tokens-181717?style=flat&logo=JSONWebTokens&logoColor=000000&color=white"> <img src="https://img.shields.io/badge/Spring-181717?style=flat&logo=Spring&logoColor=6DB33F&color=white"> <img src="https://img.shields.io/badge/Spring_Batch-181717?style=flat&logo=Spring&logoColor=6DB33F&color=white"> <img src="https://img.shields.io/badge/Apache_Kafka-181717?style=flat&logo=ApacheKafka&logoColor=231F20&color=white"> <img src="https://img.shields.io/badge/n8n-181717?style=flat&logo=n8n&logoColor=0F74E2&color=white"> <img src="https://img.shields.io/badge/Redis-181717?style=flat&logo=Redis&logoColor=DC382D&color=white">

**Database**  
<img src="https://img.shields.io/badge/MariaDB-181717?style=flat&logo=MariaDB&logoColor=003545&color=white"> <img src="https://img.shields.io/badge/PostgreSQL-181717?style=flat&logo=PostgreSQL&logoColor=336791&color=white">

**CI/CD**  
<img src="https://img.shields.io/badge/Git-000?style=flat&logo=Git&logoColor=F05032&color=white"> <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=GitHub&logoColor=black&color=white"> <img src="https://img.shields.io/badge/Jenkins-D24939?style=flat&logo=jenkins&logoColor=D24939&color=white"> <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=Docker&logoColor=2496ED&color=white"> <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=Kubernetes&logoColor=326CE5&color=white">

**Observability**  
<img src="https://img.shields.io/badge/Istio-181717?style=flat&logo=Istio&logoColor=466BB0&color=white"> <img src="https://img.shields.io/badge/Prometheus-181717?style=flat&logo=Prometheus&logoColor=E6522C&color=white"> <img src="https://img.shields.io/badge/Grafana-181717?style=flat&logo=Grafana&logoColor=F46800&color=white">

**추가 표기(인프라 & API)**  
- 인프라: Jenkins, EKS, Kubernetes, Docker, S3, CloudFront, Route53, RDS, EC2, IAM  
- API: clovaNote

<br/>

## 📦 프로젝트 구조 예시
```text
.
├─ backend/
├─ frontend/
├─ cicd/
├─ assets/
│  └─ orbit-hero.svg   # ← 대표 이미지(배너)
└─ README.md
