
export interface IUser {
    id?: number;
    name: string;
    username: string;
    email: string;
    password?: string;
    gdpr: boolean;
    img_url?: string;
    register_date?: Date;
    last_login?: Date;
}