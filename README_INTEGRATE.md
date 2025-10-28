# 내 일정 (일정 홈) – Vue3 Add-on

이 폴더는 기존 프론트에 **사이드바 '내 일정' 라우트**와 **일정 홈 화면**을 추가하기 위한 파일 모음입니다.
Figma 시안을 반영해 마일스톤 링 차트, Task 리스트, 개인 To‑Do 구성을 제공합니다.

## 포함 파일
```
src/
 ├─ api/
 │   ├─ http.ts            # Axios 인스턴스 (토큰/X-User-Id 헤더 자동 전송)
 │   └─ schedule.ts        # 일정 홈에서 쓰는 API 어댑터 (엔드포인트만 맞추면 됨)
 ├─ stores/
 │   └─ schedule.ts        # Pinia 스토어
 ├─ components/schedule/
 │   ├─ MilestoneCard.vue
 │   ├─ TaskList.vue
 │   └─ PersonalTodo.vue
 └─ views/schedule/
     └─ ScheduleHome.vue   # '내 일정' 메인 화면
patches/
 └─ router-add-schedule.txt # 라우터 추가 예시 코드
```

## 설치/연동

1) **파일 복사**
- 위 구조 그대로 기존 프로젝트의 `src/` 하위에 복사합니다.

2) **라우터 등록**
- `router/index.ts`(또는 `.js`)에 `ScheduleHome` 라우트를 추가합니다.
  - 예시는 `patches/router-add-schedule.txt` 참고.

3) **사이드바 연결**
- 사이드바 메뉴에서 `to="/schedule"` 라우터 링크를 추가하세요.
  - 이미 '내 일정' 항목이 있다면 `to`만 `/schedule` 로 맞추면 됩니다.

4) **Pinia 사용 여부**
- 프로젝트가 Pinia를 사용한다면 그대로 동작합니다.
- 사용하지 않는다면 `main.ts`에 다음을 등록하세요:
```ts
import { createPinia } from "pinia";
const app = createApp(App);
app.use(createPinia());
```

5) **.env 설정**
- API 기본 주소를 설정합니다 (API Gateway가 있다면 게이트웨이 주소):
```
VITE_API_BASE=https://YOUR-API.example.com
```
- 서비스 분리(프로젝트/캘린더) 구조라면 `schedule.ts`에서 엔드포인트 경로를 맞춰주세요.

6) **워크스페이스/유저 컨텍스트**
- 본 예시는 `localStorage.workspaceId` 및 `localStorage.userId`, `localStorage.accessToken`을 사용합니다.
- 앱에서 로그인/워크스페이스 전환 시 해당 값을 넣어주는 형태로 맞추세요.

## 엔드포인트 맞추기
`src/api/schedule.ts`에서 백엔드와 실제로 맞는 엔드포인트로 바꿔주세요.
- `fetchMyMilestones`: `/project/milestones/me`
- `fetchMyTasks`: `/project/tasks/me`
- `fetchPersonalTodos`: `/calendar/todos?type=PERSONAL`

응답 형식이 다르면 `map` 부분만 조정하면 됩니다.

## 스타일
- 기본 CSS만 사용했습니다. (Vuetify/ElementPlus 없이 동작)
- 색상은 시안의 노란색 톤(#f3c403 근사값)을 사용했습니다.

## 체크 토글
- Task/To‑Do에 대해 체크박스 클릭 시 `PATCH` 요청을 보냅니다.
- 엔드포인트가 다르면 `toggleTodo`, `toggleTask`의 URL만 수정하세요.

---

### 빠른 테스트 (목데이터로 보기)
엔드포인트 연동 전이라면, `stores/schedule.ts`의 `loadAll()`을 아래 목데이터로 잠시 교체해 화면을 확인할 수 있습니다.

```ts
this.milestones = [{ id:"m1", name:"JWT filter 구현", dday:11, progress:50 }];
this.tasks = [
  { id:"t1", title:"기획안 작성", startAt:"2025-09-12", endAt:"2025-09-14", done:true },
  { id:"t2", title:"API 문서 작성", startAt:"2025-09-12", endAt:"2025-09-19", done:false },
];
this.todos = [
  { id:"p1", title:"9시 자리 청소", done:true },
  { id:"p2", title:"3시 커피", done:false },
];
```

---

필요하면 디자인/컴포넌트 분리(캐러셀/스켈레톤/에러 상태 등)도 확장해 드릴 수 있습니다.
