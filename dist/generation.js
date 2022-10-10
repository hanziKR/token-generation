"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = __importDefault(require("mysql"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const util_1 = __importDefault(require("util"));
const time_1 = require("./time");
class TokenGeneration {
    constructor(config, hmacKey) {
        this.pool = mysql_1.default.createPool(config);
        this.hmacKey = hmacKey;
        this.getConnection = util_1.default.promisify(this.pool.getConnection);
    }
    getGeneration(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield this.getConnection();
            const query = util_1.default.promisify(connection.query);
            try {
                const q = query(`SELECT generation FROM generation where id="${id}";`);
                //generation이 없는 ID
                if (q.length == 0) {
                    query(`INSERT INTO generation values("${id}", 0);`);
                    return 0;
                }
                return q[0].generation;
            }
            finally {
                connection.release();
            }
        });
    }
    checkGeneration(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const _generation = yield this.getGeneration(token.id);
            if (_generation > token.generation) {
                return false;
            }
            return true;
        });
    }
    createRefreshToken(id, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = {
                type: "refresh",
                expires: (0, time_1.addDays)(days).toUTCString(),
                id: id,
                generation: yield this.getGeneration(id)
            };
            return refreshToken;
        });
    }
    updateRefreshToken(token, days) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.checkGeneration(token)) {
                token.generation = yield this.getGeneration(token.id);
            }
            token.expires = (0, time_1.addDays)(days).toUTCString();
            return token;
        });
    }
    createAccessToken(refreshToken, minutes) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = refreshToken;
            if (!(yield this.checkGeneration(refreshToken)))
                return null;
            const accessToken = {
                type: "access",
                expires: (0, time_1.addMinutes)(minutes).toUTCString(),
                id: id
            };
            return accessToken;
        });
    }
    tokenToString(token) {
        return jsonwebtoken_1.default.sign(token, this.hmacKey, { algorithm: "HS256", noTimestamp: true });
    }
    verifyToken(tokenString) {
        try {
            const token = jsonwebtoken_1.default.verify(tokenString, this.hmacKey);
            return token;
        }
        catch (e) {
            return null;
        }
    }
}
