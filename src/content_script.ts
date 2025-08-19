import { getPRDetails, isCommitInBranch } from "./github_api";

const branches = [
  "staging-next",
  "master",
  "nixos-unstable-small",
  "nixpkgs-unstable",
  "nixos-unstable",
];

const animationIntervals = new WeakMap<HTMLElement, number>();

function getPrNumber(): string | null {
  const prNumber = document.querySelector(".gh-header-title span")?.textContent?.replace("#", "");
  return prNumber ?? null; 
}

async function main() {
  const prUrlRegex = /https:\/\/github\.com\/(nixos|NixOS)\/nixpkgs\/pull\/\d+/;
  if (!prUrlRegex.test(window.location.href)) {
    return;
  }

  const mergedPills = Array.from(
    document.querySelectorAll<HTMLElement>(".State--merged")
  ).slice(0, 2);

  const pillsToProcess: {
    pill: HTMLElement;
    originalText: string | null;
    textNode: Node;
  }[] = [];

  for (const mergedPill of mergedPills) {
    if (mergedPill.classList.contains("nprt-hijacked")) {
      continue;
    }
    mergedPill.classList.add("nprt-hijacked");

    let textNodeToModify: Node | null = null;
    for (let i = 0; i < mergedPill.childNodes.length; i++) {
      const child = mergedPill.childNodes[i];
      if (
        child.nodeType === Node.TEXT_NODE &&
        child.textContent &&
        child.textContent.trim().length > 0
      ) {
        textNodeToModify = child;
        break;
      }
    }
    if (textNodeToModify) {
      pillsToProcess.push({
        pill: mergedPill,
        originalText: textNodeToModify.textContent,
        textNode: textNodeToModify,
      });
    } else {
      mergedPill.classList.remove("nprt-hijacked");
    }
  }

  if (pillsToProcess.length === 0) {
    return;
  }

  pillsToProcess.forEach(({ pill, textNode }) => {
    showLoadingState(pill, textNode);
  });

  const prNumber = getPrNumber();
  if (!prNumber) {
    pillsToProcess.forEach(({ pill, originalText }) => {
      restoreOriginalPill(pill, originalText);
    });
    return;
  }

  const prDetailsResult = await getPRDetails(prNumber);
  if (typeof prDetailsResult === "object" && "status" in prDetailsResult) {
    if (
      prDetailsResult.status === 403 &&
      prDetailsResult.rateLimitRemaining === 0
    ) {
      pillsToProcess.forEach(({ pill }) =>
        showErrorState(pill, "Rate limit exceeded")
      );
    } else {
      pillsToProcess.forEach(({ pill, originalText }) =>
        restoreOriginalPill(pill, originalText)
      );
    }
    return;
  }

  let lastMergedBranch: string | null = null;
  for (const branch of branches) {
    const isMergedResult = await isCommitInBranch(
      branch,
      prDetailsResult.merge_commit_sha
    );

    if (typeof isMergedResult === "object" && "status" in isMergedResult) {
      if (
        isMergedResult.status === 403 &&
        isMergedResult.rateLimitRemaining === 0
      ) {
        pillsToProcess.forEach(({ pill }) =>
          showErrorState(pill, "Rate limit exceeded")
        );
        return;
      }
      continue;
    }

    if (isMergedResult) {
      lastMergedBranch = branch;
    }
  }

  if (lastMergedBranch) {
    pillsToProcess.forEach(({ pill }) => showSuccessState(pill, lastMergedBranch!));
  } else {
    pillsToProcess.forEach(({ pill, originalText }) =>
      restoreOriginalPill(pill, originalText)
    );
  }
}

function restoreOriginalPill(pill: HTMLElement, text: string | null) {
    const container = pill.querySelector<HTMLElement>('.nprt-text-container');
    if (container) {
        const intervalId = animationIntervals.get(container);
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            animationIntervals.delete(container);
        }
        pill.replaceChild(document.createTextNode(text || ''), container);
    }
    pill.classList.remove("nprt-hijacked");
}

function showLoadingState(pill: HTMLElement, textNode: Node) {
    const loadingContainer = document.createElement('span');
    loadingContainer.classList.add('nprt-text-container');
    
    pill.replaceChild(loadingContainer, textNode);

    loadingContainer.appendChild(document.createTextNode(' Merged into'));
    const dot1 = document.createElement('span');
    dot1.style.visibility = 'hidden';
    dot1.textContent = '.';
    const dot2 = document.createElement('span');
    dot2.style.visibility = 'hidden';
    dot2.textContent = '.';
    const dot3 = document.createElement('span');
    dot3.style.visibility = 'hidden';
    dot3.textContent = '.';
    loadingContainer.appendChild(dot1);
    loadingContainer.appendChild(dot2);
    loadingContainer.appendChild(dot3);

    const dots = [dot1, dot2, dot3];
    let visibleDots = 0;

    const updateDots = () => {
        dots.forEach((dot, index) => {
            dot.style.visibility = index < visibleDots ? 'visible' : 'hidden';
        });
        visibleDots = (visibleDots + 1) % 4;
    }

    updateDots();
    const intervalId = window.setInterval(updateDots, 500);
    animationIntervals.set(loadingContainer, intervalId);
}

function showErrorState(pill: HTMLElement, message: string) {
  // TODO: Improve
    const container = pill.querySelector<HTMLElement>('.nprt-text-container');
    if (container) {
        const intervalId = animationIntervals.get(container);
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            animationIntervals.delete(container);
        }
        container.textContent = ` ${message}`;
    }
}

function showSuccessState(pill: HTMLElement, mergedBranch: string) {
    const container = pill.querySelector<HTMLElement>('.nprt-text-container');
    if(container) {
        const intervalId = animationIntervals.get(container);
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            animationIntervals.delete(container);
        }
        container.textContent = " Merged into " + mergedBranch;
    }
}

main();
document.addEventListener("turbo:load", main);
