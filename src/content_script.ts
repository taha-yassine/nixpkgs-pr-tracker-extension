import { getPRDetails, isCommitInBranch } from "./github_api";

const branches = [
  "staging-next",
  "master",
  "nixos-unstable-small",
  "nixpkgs-unstable",
  "nixos-unstable",
];

let animationInterval: number | undefined;

function getPrNumber(): string | null {
  const prNumber = document.querySelector(".gh-header-title span")?.textContent?.replace("#", "");
  return prNumber ?? null; 
}

async function main() {
  const prUrlRegex = /https:\/\/github\.com\/(nixos|NixOS)\/nixpkgs\/pull\/\d+/;
  if (!prUrlRegex.test(window.location.href)) {
    return;
  }

  const mergedPill = document.querySelector<HTMLElement>(".State--merged");

  if (!mergedPill) {
    // PR is not merged, exiting.
    return;
  }

  if (mergedPill.classList.contains("nprt-hijacked")) {
    return;
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

  if (!textNodeToModify) {
      // Could not find text to modify in merged pill.
      mergedPill.classList.remove("nprt-hijacked");
      return;
  }

  const originalText = textNodeToModify.textContent;

  showLoadingState(mergedPill, textNodeToModify);

  const prNumber = getPrNumber();
  if (!prNumber) {
    // Could not get PR number.
    restoreOriginalPill(mergedPill, originalText);
    return;
  }

  const prDetailsResult = await getPRDetails(prNumber);
  if (typeof prDetailsResult === "object" && "status" in prDetailsResult) {
    if (prDetailsResult.status === 403 && prDetailsResult.rateLimitRemaining === 0) {
      showErrorState(mergedPill, "Rate limit exceeded");
    } else {
      restoreOriginalPill(mergedPill, originalText);
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
      if (isMergedResult.status === 403 && isMergedResult.rateLimitRemaining === 0) {
        showErrorState(mergedPill, "Rate limit exceeded");
        return;
      }
      continue;
    }

    if (isMergedResult) {
      lastMergedBranch = branch;
    }
  }

  if (lastMergedBranch) {
    showSuccessState(mergedPill, lastMergedBranch);
  } else {
    restoreOriginalPill(mergedPill, originalText);
  }
}

function restoreOriginalPill(pill: HTMLElement, text: string | null) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = undefined;
    }
    const container = pill.querySelector('#nixpkgs-tracker-text-container');
    if (container) {
        pill.replaceChild(document.createTextNode(text || ''), container);
    }
    pill.classList.remove("nprt-hijacked");
}

function showLoadingState(pill: HTMLElement, textNode: Node) {
    if (animationInterval) {
        clearInterval(animationInterval);
    }

    const loadingContainer = document.createElement('span');
    loadingContainer.id = 'nprt-text-container';
    
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
    animationInterval = window.setInterval(updateDots, 500);
}

function showErrorState(pill: HTMLElement, message: string) {
  // TODO: Improve
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = undefined;
    }
    const container = pill.querySelector<HTMLElement>('#nprt-text-container');
    if (container) {
        container.textContent = ` ${message}`;
    }
}

function showSuccessState(pill: HTMLElement, mergedBranch: string) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = undefined;
    }
    const container = pill.querySelector<HTMLElement>('#nprt-text-container');
    if(container) {
        container.textContent = " Merged into " + mergedBranch;
    }
}

main();
document.addEventListener("turbo:load", main);
document.addEventListener("pjax:end", main);

