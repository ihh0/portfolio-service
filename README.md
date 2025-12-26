# Portfolio Service

## 프로젝트 개요
포트폴리오 관리 서비스 API입니다. 사용자/프로젝트/기술/경력 데이터를 관리하고, JWT 기반 인증·인가 및 소셜 로그인(GitHub, Firebase)을 제공합니다.

주요 기능
- 로컬 회원가입/로그인, 토큰 갱신/로그아웃
- GitHub OAuth, Firebase 인증
- 사용자/프로젝트/기술/경력 CRUD
- 프로젝트 좋아요, 관리자 통계
- 우수 사용자의 프로젝트 탐색 노출도 증가

## 실행 방법

로컬 실행
```bash
npm install

# 마이그레이션 (로컬)
npx prisma migrate dev

# 시드 데이터 (빌드 후 실행)
npm run build
node dist/seed/run.js

# 서버 실행
npm run dev
```

운영/배포 환경
```bash
npm install
npx prisma migrate deploy
npm run build
npm run start
```

## 환경변수 설명 (.env.example 매칭)
- `PORT`: 서버 포트
- `CORS_ORIGIN`: 허용할 CORS Origin (콤마 구분)
- `APP_VERSION`: 앱 버전 표기
- `BUILD_TIME`: 빌드 시간 표기
- `LOG_LEVEL`: 로그 레벨
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: 도커 기본값 문서용 값
- `DATABASE_URL`: DB 접속 URL (TypeORM/Prisma 모두 사용)
- `REDIS_URL`: Redis 접속 URL
- `JWT_ACCESS_SECRET`: Access 토큰 비밀키
- `JWT_REFRESH_SECRET`: Refresh 토큰 비밀키
- `JWT_ACCESS_EXPIRES_IN`: Access 토큰 만료
- `JWT_REFRESH_EXPIRES_IN`: Refresh 토큰 만료
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`: GitHub OAuth 설정
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase Admin 서비스 계정 JSON (1줄)

## 배포 주소
- Base URL: `http://<SERVER_HOST>:8080`
- Swagger: `http://<SERVER_HOST>:8080/docs`
- Health: `http://<SERVER_HOST>:8080/health`

## 인증 플로우 설명
1) 로컬 로그인
- `POST /auth/register` → access/refresh 토큰 발급
- `POST /auth/login` → access/refresh 토큰 발급

2) 토큰 갱신/로그아웃
- `POST /auth/refresh` → refresh 토큰 회전
- `POST /auth/logout` → refresh 토큰 무효화

3) 소셜 로그인
- GitHub OAuth: `GET /auth/oauth/github` → `GET /auth/oauth/github/callback`
- Firebase: `POST /auth/firebase` (idToken 검증)

## 역할/권한표
| 구분 | 접근 가능 API |
| --- | --- |
| Public | `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/oauth/github`, `GET /auth/oauth/github/callback`, `POST /auth/firebase`, `GET /users`, `GET /users/{uid}`, `GET /users/{uid}/projects`, `GET /projects`, `GET /projects/{id}`, `GET /skills`, `GET /users/{uid}/experiences`, `GET /experiences/{id}` |
| ROLE_USER | Public + `PATCH /users/{uid}`(본인), `DELETE /users/{uid}`(본인), `POST /projects`, `PATCH /projects/{id}`(본인), `DELETE /projects/{id}`(본인), `POST/DELETE /projects/{id}/likes`, `POST /users/{uid}/experiences`(본인), `PATCH/DELETE /experiences/{id}`(본인) |
| ROLE_ADMIN | ROLE_USER + `PATCH /users/{uid}/featured`, `POST/PATCH/DELETE /skills`, `GET /admin/stats/overview` |

## 예제 계정
- `user1@example.com / P@ssw0rd!`
- `admin@example.com / P@ssw0rd!` (ROLE_ADMIN 계정으로 직접 생성 필요)

## DB 연결 정보(테스트용)
- Host: `db` (docker-compose 내부), `localhost` (호스트 접근)
- Port: `3306`
- DB: `portfolio`
- User: `app`
- Password: `app`
- 권한: `portfolio` DB 전체 권한

## 엔드포인트 요약표
| Method | URL | 설명 |
| --- | --- | --- |
| GET | /health | 헬스체크 |
| POST | /auth/register | 로컬 회원가입 |
| POST | /auth/login | 로컬 로그인 |
| POST | /auth/refresh | 토큰 갱신 |
| POST | /auth/logout | 로그아웃 |
| GET | /auth/oauth/github | GitHub OAuth 시작 |
| GET | /auth/oauth/github/callback | GitHub OAuth 콜백 |
| POST | /auth/firebase | Firebase 로그인 |
| GET | /users | 사용자 목록 |
| GET | /users/{uid} | 사용자 프로필 |
| PATCH | /users/{uid} | 사용자 수정 |
| DELETE | /users/{uid} | 사용자 삭제 |
| PATCH | /users/{uid}/featured | 사용자 featured 설정 |
| GET | /users/{uid}/projects | 사용자 프로젝트 목록 |
| GET | /projects | 프로젝트 목록 |
| GET | /projects/{id} | 프로젝트 상세 |
| POST | /projects | 프로젝트 생성 |
| PATCH | /projects/{id} | 프로젝트 수정 |
| DELETE | /projects/{id} | 프로젝트 삭제 |
| POST | /projects/{id}/likes | 프로젝트 좋아요 |
| DELETE | /projects/{id}/likes | 프로젝트 좋아요 취소 |
| GET | /skills | 기술 목록 |
| POST | /skills | 기술 생성 |
| PATCH | /skills/{id} | 기술 수정 |
| DELETE | /skills/{id} | 기술 삭제 |
| GET | /users/{uid}/experiences | 경력 목록 |
| GET | /experiences/{id} | 경력 상세 |
| POST | /users/{uid}/experiences | 경력 생성 |
| PATCH | /experiences/{id} | 경력 수정 |
| DELETE | /experiences/{id} | 경력 삭제 |
| GET | /admin/stats/overview | 관리자 통계 |

## 성능/보안 고려사항
- 전역 Rate Limit 적용
- JWT 만료/위조 처리
- bcrypt 해시 사용
- MySQL 인덱스/유니크 제약 적용(마이그레이션 기준)
- Redis로 refresh 세션 관리 및 통계 캐싱

## 한계와 개선 계획
- Postman 컬렉션 미완성 → 추가 예정
- 마이그레이션 자동화 스크립트 추가 예정
- Redis 장애 시 인증 기능 복구 전략 개선 예정
