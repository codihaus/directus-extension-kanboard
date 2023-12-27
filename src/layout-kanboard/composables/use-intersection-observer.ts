export function useIntersectionObserver() {
    const isInViewport = ref<boolean>(false)
    const loader = ref(document.createElement("div"));
    const intersectionObserver = ref(
        new IntersectionObserver(handleObserve, {
            root: null,
            rootMargin: "0px",
            threshold: 0,
        })
    );

    function handleObserve(entries: IntersectionObserverEntry[]): void {
        isInViewport.value = entries[0].intersectionRatio > 0;
    }

    onMounted(() => {
        intersectionObserver.value.observe(loader.value);
    });

    onUnmounted(() => {
        intersectionObserver.value?.disconnect();
    });

    return { loader, isInViewport };
}