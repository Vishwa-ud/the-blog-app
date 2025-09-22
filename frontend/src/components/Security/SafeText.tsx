import React from "react";
import DOMPurify from "dompurify";
import Typography, { TypographyProps } from "@mui/material/Typography";

interface SafeTextProps extends TypographyProps {
  content?: string; // optional now
  children?: React.ReactNode;
}

const SafeText: React.FC<SafeTextProps> = ({ content, children, ...props }) => {
  if (content) {
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "ul", "ol", "li", "br"],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });

    return <Typography {...props} dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return <Typography {...props}>{children}</Typography>;
};

export default SafeText;
