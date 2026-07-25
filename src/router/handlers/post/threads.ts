import { StatusCodes } from "http-status-codes";
import { RequestHandler, respondWithScreenshot, SCREENSHOT_CONFIG } from "..";
import { Renderer } from ".";

export const handleThreadsPost: RequestHandler = async (req, res, url) => {
  const logger = req.$logger.subTagged("threads");
  logger.debug("Threads post URL", url.toString());

  const matcher = /^\/@(?<username>[^/]+)\/(?<postId>[a-zA-Z0-9]+)/;

  const match = matcher.exec(url.pathname);

  const username = match?.groups?.username;
  const postId = match?.groups?.postId;

  if (!username || !postId) {
    logger.debug("Invalid threads URL", url.toString());
    return res.sendStatus(StatusCodes.FORBIDDEN);
  }

  logger.setTags({ user: username, post: postId });
  logger.debug("Post", postId, "by", username);

  return respondWithScreenshot({
    logger,
    req,
    res,
    url,
    handler: renderPost,
    filenameFn: () => `threads.${username}.${postId}`,
  });
};

const renderPost: Renderer = async (context, url, logger) => {
  logger.debug("Start rendering threads page", url.toString());
  const page = await context.newPage();

  await page.goto(url.toString());

  await page.waitForLoadState("networkidle");

  const $post = page.locator(
    `[aria-label="Column body"] [data-pagelet="threads_post_page_0"] [data-pressable-container]`,
  );

  await $post.evaluate(($el) => {
    // Remove modals
    {
      document.querySelector("body > div:has([aria-modal])")?.remove();
    }

    // Remove the three dots next to the username
    {
      $el.querySelector('[aria-haspopup="menu"]')?.remove();
    }

    // Add padding
    {
      $el.style.padding = "1em";
    }

    // Zoom in page to get bigger and better screenshots
    {
      document.body.style.zoom = "2.0";
    }
  });

  return $post.screenshot(SCREENSHOT_CONFIG);
};
