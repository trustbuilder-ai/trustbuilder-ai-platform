import React from "react";
import { Container, Heading, Text, Flex } from "@radix-ui/themes";

const Models = () => {
  return (
    <Container size="3" p="5">
      <Heading size="8" mb="5">Models</Heading>
      <Flex direction="column" gap="4">
        <Text as="p">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget
          tortor risus. Curabitur arcu erat, accumsan id imperdiet et, porttitor
          at sem.
        </Text>
        <Text as="p">
          Pellentesque in ipsum id orci porta dapibus. Nulla porttitor accumsan
          tincidunt. Donec rutrum congue leo eget malesuada. Curabitur non nulla
          sit amet nisl tempus convallis quis ac lectus.
        </Text>
        <Text as="p">
          Vivamus magna justo, lacinia eget consectetur sed, convallis at
          tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Quisque velit nisi, pretium ut lacinia in, elementum id enim.
        </Text>
        <Text as="p">
          Curabitur aliquet quam id dui posuere blandit. Vestibulum ac diam sit
          amet quam vehicula elementum sed sit amet dui. Mauris blandit aliquet
          elit, eget tincidunt nibh pulvinar a.
        </Text>
      </Flex>
    </Container>
  );
};

export default Models;
