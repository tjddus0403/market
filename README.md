# 🥕 당근마켓 클론

Next.js와 Supabase를 활용한 당근마켓 스타일의 중고거래 플랫폼 (커스텀 인증 시스템)

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 설정

#### 2.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 대시보드에서 `Settings` > `API`로 이동합니다.
3. `Project URL`과 `anon public` 키를 복사합니다.

#### 2.2 환경변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2.3 데이터베이스 테이블 생성
Supabase 대시보드의 SQL Editor에서 `schema.sql` 파일의 내용을 실행합니다.

```sql
-- schema.sql 파일의 모든 내용을 복사해서 SQL Editor에 붙여넣고 실행
-- users, market, comments 테이블이 모두 생성됩니다
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 📊 데이터베이스 스키마

> **중요**: 모든 테이블은 `schema.sql` 파일에서 한 번에 생성할 수 있습니다.

### 1. users 테이블 (사용자 정보)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본키 (자동 생성) |
| email | TEXT | 사용자 이메일 (UNIQUE) |
| password_hash | TEXT | 암호화된 비밀번호 |
| nickname | TEXT | 사용자 닉네임 (UNIQUE) |
| avatar_url | TEXT | 프로필 이미지 URL |
| location | TEXT | 거주 지역 (기본값: '함정동') |
| rating | REAL | 사용자 평점 (기본값: 5.0) |
| trade_count | INTEGER | 거래 완료 수 (기본값: 0) |
| created_at | TIMESTAMP | 가입 시간 |
| updated_at | TIMESTAMP | 수정 시간 |

### 2. market 테이블 (상품 정보)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본키 (자동 생성) |
| user_id | UUID | 등록자 ID (users 테이블 참조) |
| title | TEXT | 상품 제목 |
| description | TEXT | 상품 설명 |
| price | INTEGER | 상품 가격 (기본값: 0) |
| image | TEXT | 상품 이미지 URL |
| trade_type | TEXT | 거래방식 ('sell' 또는 'share') |
| created_at | TIMESTAMP | 생성 시간 |
| updated_at | TIMESTAMP | 수정 시간 |

### 3. comments 테이블 (댓글 정보)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본키 (자동 생성) |
| product_id | UUID | 상품 ID (market 테이블 참조) |
| user_id | UUID | 작성자 ID (users 테이블 참조) |
| content | TEXT | 댓글 내용 |
| created_at | TIMESTAMP | 작성 시간 |
| updated_at | TIMESTAMP | 수정 시간 |

## 🔧 주요 기능

### ✅ 커스텀 사용자 인증 시스템
- 🔐 **회원가입**: 이메일 + 비밀번호 + 닉네임 (커스텀 users 테이블)
- 🔑 **로그인**: 이메일/비밀번호 기반 인증 (SHA-256 해시)
- 🗝️ **세션 관리**: localStorage 기반 24시간 세션
- 👤 **사용자 프로필**: 닉네임, 지역, 평점, 거래 수
- 🔒 **인증 보호**: 로그인 필요한 페이지 자동 리다이렉트
- ⚡ **실시간 상태 관리**: 로그인/로그아웃 즉시 반영

### ✅ 상품 관리
- ➕ **상품 등록**: 제목, 설명, 가격, 이미지, 거래방식
- 📋 **상품 목록**: 실시간 데이터베이스 연동, 검색/필터/정렬 기능
- 👁️ **상품 상세**: 판매자 정보 포함 상세 보기
- 🔄 **거래방식**: 판매하기 / 나눠하기 구분
- ❤️ **관심상품**: 찜하기 기능 (localStorage 기반)
- 👨‍💼 **판매자 연동**: users 테이블과 JOIN으로 실제 사용자 정보 표시

### ✅ 댓글 시스템
- 💬 **댓글 작성**: 로그인한 사용자만 댓글 작성 가능
- 👀 **댓글 조회**: 작성자 정보와 함께 실시간 표시
- ✏️ **댓글 수정**: 본인 댓글만 수정 가능
- 🗑️ **댓글 삭제**: 본인 댓글만 삭제 가능
- 🔗 **사용자 연동**: 댓글 작성자 정보 자동 매핑

### ✅ UI/UX
- 📱 **반응형 디자인**: 모바일 최적화
- 🎨 **당근마켓 스타일**: 오리지널과 유사한 디자인
- ⚡ **로딩/에러 상태**: 사용자 친화적 피드백
- 🔄 **실시간 상태**: 로그인/로그아웃 즉시 반영

## 📱 페이지 구조

```
/                    → 메인 홈페이지 (로그인 상태별 UI)
/auth/login          → 로그인 (커스텀 인증)
/auth/signup         → 회원가입 (커스텀 인증)
/products            → 상품 목록 (검색/필터/정렬, 관심상품)
/products/[id]       → 상품 상세 (판매자 정보, 댓글 시스템)
/sell                → 상품 등록 (로그인 필요)
/sell/edit/[id]      → 상품 수정 (본인 상품만)
/profile             → 사용자 프로필 (내 정보, 통계)
/profile/edit        → 프로필 수정 (로그인 필요)
/my-products         → 내가 올린 상품 관리 (로그인 필요)
```

## 🗃️ 파일 구조

### 📄 데이터베이스 스키마
- `schema.sql` - **통합 데이터베이스 스키마** (users, market, comments 테이블)

### 🎨 컴포넌트
- `ProductCard.js` - 상품 카드 컴포넌트 (React.memo 최적화)
- `LocationPicker.js` - 지역 선택 컴포넌트

### 🧠 Context
- `AuthContext.js` - 사용자 인증 및 댓글 관리
- `FavoritesContext.js` - 관심상품 관리 (localStorage)

## 🛡️ 보안 및 권한

### 커스텀 인증 시스템
- **비밀번호 해시**: SHA-256 + Salt 사용
- **세션 관리**: localStorage 기반 24시간 만료
- **중복 검증**: 이메일/닉네임 중복 확인
- **입력 검증**: 클라이언트/서버 사이드 검증

### Row Level Security (RLS)
- **users 테이블**: 모든 사람이 조회 가능, 본인만 수정 가능
- **market 테이블**: 모든 사람이 조회 가능, 로그인한 사용자만 등록 가능, 본인만 수정/삭제 가능

### 인증 플로우
1. **회원가입** → 중복 확인 → 비밀번호 해시 → users 테이블 저장
2. **로그인** → 이메일/해시 매칭 → 세션 생성 → localStorage 저장
3. **상품 등록** → 세션 확인 → user_id와 함께 저장
4. **페이지 보호** → 세션 확인 → 미인증 시 로그인 페이지로 리다이렉트

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL만 사용, Auth 미사용)
- **인증**: 커스텀 인증 시스템 (SHA-256 + localStorage)
- **상태관리**: React Context (AuthContext)
- **스타일링**: Tailwind CSS
- **배포**: Vercel (권장)

## 🎯 사용 시나리오

### 1. 신규 사용자
1. 회원가입 (이메일, 닉네임, 비밀번호)
2. 로그인 (바로 가능, 이메일 인증 불필요)
3. 상품 둘러보기 또는 등록

### 2. 기존 사용자
1. 로그인
2. 메인 페이지에서 개인 정보 확인
3. 상품 등록/조회
4. 타 사용자의 상품 상세 정보 확인

## 🔑 테스트 계정

SQL 스키마 실행 후 다음 계정으로 테스트 가능:

```
이메일: test@example.com
비밀번호: 실제 비밀번호 (해시된 값이 아님)
닉네임: 테스트유저
```

**주의**: 실제 환경에서는 샘플 계정을 삭제하고 사용하세요.

## ⚠️ 보안 고려사항

현재 구현은 학습 목적이므로 실제 운영 환경에서는 다음을 개선하세요:

1. **더 강력한 해시**: bcrypt 또는 Argon2 사용
2. **JWT 토큰**: localStorage 대신 HTTP-only 쿠키
3. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS 사용
4. **비밀번호 정책**: 더 강력한 비밀번호 요구사항
5. **Rate Limiting**: 로그인 시도 제한

## 📝 TODO

- [ ] bcrypt 해싱으로 보안 강화
- [ ] JWT 토큰 기반 인증 시스템
- [ ] 이미지 스토리지 연동 (Supabase Storage)
- [ ] 찜하기 기능 구현
- [ ] 채팅 기능 구현
- [ ] 카테고리 필터링
- [ ] 검색 기능
- [ ] 사용자 프로필 페이지
- [ ] 거래 완료 처리
- [ ] 신고 기능
- [ ] 푸시 알림

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 학습 목적으로 제작되었습니다.
