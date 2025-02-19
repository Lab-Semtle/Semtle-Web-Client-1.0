/** 서버 환경에서의 MSW 설정 */

import { setupServer } from 'msw/node';
import handlers from './handlers';

export const server = setupServer(...handlers);
