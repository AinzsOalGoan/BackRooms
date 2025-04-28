export const formatDuration = (durationInSeconds) => {
    if (!durationInSeconds) return "0 sec";

    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    if (minutes > 0) {
        return `${minutes} min ${seconds} sec`;
    } else {
        return `${seconds} sec`;
    }
};
