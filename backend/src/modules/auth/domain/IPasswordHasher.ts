export interface IPasswordHasher {
  hash(plano: string): Promise<string>;
  comparar(plano: string, hash: string): Promise<boolean>;
}
