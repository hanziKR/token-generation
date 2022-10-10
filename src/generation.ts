import mysql from "mysql"
import jwt from "jsonwebtoken"
import util from "util"
import { addDays, addMinutes } from "./time"

interface IToken {
    type: string,
    expires: string
}
interface IRefreshToken extends IToken {
    id: string,
    generation: number
}
interface IAccessToken extends IToken {
    id: string
}

class TokenGeneration {
    private pool: mysql.Pool;
    private hmacKey: Buffer;
    private getConnection: () => Promise<mysql.PoolConnection>;

    constructor(config: mysql.PoolConfig, hmacKey: Buffer) {
        this.pool = mysql.createPool(config);
        this.hmacKey = hmacKey;
        this.getConnection = util.promisify(this.pool.getConnection).bind(this.pool);
    }
    private async getGeneration(id: string): Promise<number> {
        const connection = await this.getConnection();
        const query = util.promisify(connection.query).bind(connection);

        try {
            const q: any = await query(`SELECT generation FROM generation where id="${id}";`);

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
    }
    async addGeneration(id: string): Promise<void> {
        const connection = await this.getConnection();
        const query = util.promisify(connection.query).bind(connection);

        query(`UPDATE generation set generation=generation+1 where id="${id}";`);
    }
    async checkGeneration(token: IRefreshToken): Promise<boolean> {
        const _generation = await this.getGeneration(token.id);

        if (_generation > token.generation) {
            return false;
        }
        return true;
    }
    async createRefreshToken(id: string, days: number): Promise<IRefreshToken> {
        const refreshToken: IRefreshToken = {
            type: "refresh",
            expires: addDays(days).toUTCString(),
            id: id,
            generation: await this.getGeneration(id)
        }
        return refreshToken;
    }
    async updateRefreshToken(token: IRefreshToken, days: number): Promise<IRefreshToken> {
        if (!this.checkGeneration(token)) {
            token.generation = await this.getGeneration(token.id);
        }
        token.expires = addDays(days).toUTCString();

        return token;
    }
    async createAccessToken(refreshToken: IRefreshToken, minutes: number): Promise<IAccessToken | null> {
        const { id } = refreshToken;
        if (!await this.checkGeneration(refreshToken)) return null;

        const accessToken: IAccessToken = {
            type: "access",
            expires: addMinutes(minutes).toUTCString(),
            id: id
        }

        return accessToken;
    }
    tokenToString(token: IToken): string {
        return jwt.sign(token, this.hmacKey, { algorithm: "HS256", noTimestamp: true });
    }
    verifyToken(tokenString: string): IToken | null {
        try {
            const token = jwt.verify(tokenString, this.hmacKey) as IToken;
            return token;
        } catch (e) {
            return null;
        }
    }
    close() {
        this.pool.end();
    }
}

export default TokenGeneration;
export { IToken, IRefreshToken, IAccessToken };