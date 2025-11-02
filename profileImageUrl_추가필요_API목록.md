# profileImageUrl 추가가 필요한 API 목록

## 1. AddPermissionGroupUsers.vue

### 1.1 개별 사용자 검색
- **API**: `POST /workspace-service/workspace/participants/search`
- **위치**: `searchIndividualUsers()` 메서드 (259-287줄)
- **현재 상태**: 
  - `userInfoList`에서 `userId`, `userName`, `userEmail`만 사용
  - `profileImageUrl` 필드 없음
- **사용 위치**: 
  - 35줄: `individualUsers` 목록 표시
  - 106줄: `selectedUsers` 목록 표시

### 1.2 개별 사용자 목록 로드
- **API**: `POST /workspace-service/workspace/participants/search`
- **위치**: `loadIndividualUsers()` 메서드 (228-256줄)
- **현재 상태**: 
  - `userInfoList`에서 `userId`, `userName`, `userEmail`만 사용
  - `profileImageUrl` 필드 없음

### 1.3 기존 멤버 로드
- **API**: `GET /workspace-service/access/group-detail/{groupId}`
- **위치**: `loadExistingMembers()` 메서드 (164-191줄)
- **현재 상태**: 
  - `userList`에서 `userInfo.userId`, `userInfo.userName`, `userInfo.userEmail`만 사용
  - `userInfo.profileImageUrl` 필드 확인 필요
- **사용 위치**: 106줄 `selectedUsers` 목록 표시

### 1.4 사용자 그룹 검색
- **API**: `POST /workspace-service/groups/search`
- **위치**: `searchUserGroups()`, `loadUserGroups()` 메서드
- **현재 상태**: 
  - `group.participants` 배열 사용 (330-338줄)
  - `participant.userId`, `participant.userName`, `participant.userEmail`만 사용
  - `participant.profileImageUrl` 필드 확인 필요

---

## 2. EditUserGroup.vue

### 2.1 그룹 정보 로드 (기존 멤버)
- **API**: `GET /workspace-service/groups/{groupId}`
- **위치**: `loadGroupInfo()` 메서드 (157-198줄)
- **현재 상태**: 
  - `members.content`에서 `profileImageUrl`을 저장하지만 UI에서 사용 안 함 (183줄)
  - 템플릿에서 95줄에 `user_default_icon.svg` 하드코딩
- **수정 필요**: 저장된 `profileImageUrl`을 UI에 사용

### 2.2 사용 가능한 사용자 목록 로드
- **API**: `POST /workspace-service/workspace/participants/not-in-groups/search`
- **위치**: `loadAvailableUsers()` 메서드 (201-228줄)
- **현재 상태**: 
  - `userInfoList`에서 전체 객체 사용하지만 `profileImageUrl` 확인 필요
- **사용 위치**: 49줄 `availableUsers` 목록 표시

### 2.3 사용자 검색
- **API**: `POST /workspace-service/workspace/participants/not-in-groups/search`
- **위치**: `searchUsers()` 메서드 (230-256줄)
- **현재 상태**: 
  - `userInfoList`에서 전체 객체 사용하지만 `profileImageUrl` 확인 필요
- **사용 위치**: 49줄 `availableUsers` 목록 표시

---

## 3. CreateUserGroup.vue

### 3.1 사용 가능한 사용자 목록 로드
- **API**: `POST /workspace-service/workspace/participants/not-in-groups/search`
- **위치**: `loadAvailableUsers()` 메서드 (146-166줄)
- **현재 상태**: 
  - `userInfoList`에서 전체 객체 사용하지만 `profileImageUrl` 확인 필요
- **사용 위치**: 49줄 `availableUsers` 목록 표시

### 3.2 사용자 검색
- **API**: `POST /workspace-service/workspace/participants/not-in-groups/search`
- **위치**: `searchUsers()` 메서드 (169-194줄)
- **현재 상태**: 
  - `userInfoList`에서 전체 객체 사용하지만 `profileImageUrl` 확인 필요
- **사용 위치**: 49줄, 95줄 `availableUsers`, `selectedUsers` 목록 표시

---

## 4. UserGroupDetail.vue

### 4.1 사용자 그룹 상세 조회
- **API**: `GET /workspace-service/groups/{groupId}`
- **위치**: `loadUserGroupDetail()` 메서드 (102-139줄)
- **현재 상태**: 
  - `members.content`에서 `userId`, `userName`, `userEmail`만 사용
  - `profileImageUrl` 필드 확인 필요
- **사용 위치**: 58줄 `members` 목록 표시

---

## 5. PermissionGroupDetail.vue

### 5.1 권한 그룹 상세 조회
- **API**: `GET /workspace-service/access/group-detail/{groupId}`
- **위치**: `loadGroupDetail()` 메서드 (91-152줄)
- **현재 상태**: 
  - `userList`에서 `userInfo.userId`, `userInfo.userName`, `userInfo.userEmail`만 사용
  - 더미 데이터에는 `profileImageUrl: null` 포함 (126, 135, 144줄)
  - 실제 API 응답에서 `userInfo.profileImageUrl` 확인 필요
- **사용 위치**: 42줄 `members` 목록 표시

---

## 요약

### profileImageUrl 필드가 필요한 API 응답 구조:

1. **POST /workspace-service/workspace/participants/search**
   - 응답: `result.userInfoList[]`
   - 필요한 필드: `profileImageUrl` 추가

2. **POST /workspace-service/workspace/participants/not-in-groups/search**
   - 응답: `result.userInfoList[]`
   - 필요한 필드: `profileImageUrl` 추가

3. **GET /workspace-service/groups/{groupId}**
   - 응답: `result.members.content[]`
   - 필요한 필드: `profileImageUrl` 추가

4. **GET /workspace-service/access/group-detail/{groupId}**
   - 응답: `result.userList[].userInfo`
   - 필요한 필드: `userInfo.profileImageUrl` 추가

5. **POST /workspace-service/groups/search**
   - 응답: `result.content[].participants[]`
   - 필요한 필드: `participants[].profileImageUrl` 추가

### UI에서 수정이 필요한 파일:

1. **AddPermissionGroupUsers.vue** - 35줄, 106줄
2. **EditUserGroup.vue** - 49줄, 95줄 (이미 저장되지만 사용 안 함)
3. **CreateUserGroup.vue** - 49줄, 95줄
4. **UserGroupDetail.vue** - 58줄
5. **PermissionGroupDetail.vue** - 42줄

