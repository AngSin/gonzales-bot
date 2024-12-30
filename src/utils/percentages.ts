export const sellPercentages = ['50%', '100%'];

export const getDividerFromPercentage = (percentage: string) => {
    switch (percentage) {
        case '50%':
            return 2n;
        case '100%':
        default:
            return 1n;
    }
}