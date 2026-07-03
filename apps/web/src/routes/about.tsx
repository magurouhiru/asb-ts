import { Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: PrivacyPolicyComponent,
});

function PrivacyPolicyComponent() {
  return (
    <div>
      <h2 className="font-medium">Credits</h2>
      <p>
        This web application is based on{" "}
        <a
          href="https://github.com/cadon/ARKStatsExtractor"
          target="_blank"
          rel="noopener"
          className="text-blue-500 underline"
        >
          ARK Smart Breeding
        </a>{" "}
        by cadon.
      </p>

      <Separator className="my-4"></Separator>

      <p className="my-2">The MIT License (MIT) </p>
      <p className="my-2">Copyright (c) 2015 cadon</p>
      <div>
        Permission is hereby granted, free of charge, to any person obtaining a
        copy of this software and associated documentation files (the
        "Software"), to deal in the Software without restriction, including
        without limitation the rights to use, copy, modify, merge, publish,
        distribute, sublicense, and/or sell copies of the Software, and to
        permit persons to whom the Software is furnished to do so, subject to
        the following conditions: The above copyright notice and this permission
        notice shall be included in all copies or substantial portions of the
        Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
        KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
        IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
        CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
        TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
        SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      </div>
    </div>
  );
}
