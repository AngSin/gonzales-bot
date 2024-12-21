export const getMandatoryEnvVariable = <T = string>(
    variableName: string,
): T => {
    const value = process.env[variableName] as T;
    if (!value) {
        console.error(`failed to load env variable ${variableName}`);
        throw new Error(`${variableName} not set`);
    }
    return value;
};
