import React from "react";
import { Container, Heading, Text, Flex } from "@radix-ui/themes";

const RedTeaming = () => {
  return (
    <Container size="3" p="5">
      <Heading size="8" mb="5">RedTeaming</Heading>
      <Flex direction="column" gap="4">
        <Text as="p">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
          sollicitudin molestie malesuada. Curabitur aliquet quam id dui posuere
          blandit.
        </Text>
        <Text as="p">
          Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
          posuere cubilia curae; Donec velit neque, auctor sit amet aliquam vel,
          ullamcorper sit amet ligula. Praesent sapien massa, convallis a
          pellentesque nec, egestas non nisi.
        </Text>
        <Text as="p">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porttitor
          lectus nibh. Nulla quis lorem ut libero malesuada feugiat. Vivamus
          magna justo, lacinia eget consectetur sed, convallis at tellus.
        </Text>
        <Text as="p">
          Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.
          Proin eget tortor risus. Donec rutrum congue leo eget malesuada.
          Pellentesque in ipsum id orci porta dapibus.
        </Text>
      </Flex>
    </Container>
  );
};

export default RedTeaming;
