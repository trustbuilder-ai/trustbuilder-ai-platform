import React from "react";
import { Link } from "react-router-dom";
import { Container, Heading, Text, Flex, Card, Button } from "@radix-ui/themes";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";

const WargamesDashboard = () => {
  return (
    <Container size="3" p="5">
      <Heading size="8" mb="5">Wargames</Heading>

      {/* Launch Challenge Section */}
      <Card mb="6">
        <Flex direction="column" gap="3">
          <Heading size="5">Wargames AI Challenge</Heading>
          <Text color="gray">
            Enter the Wargames AI Challenge interface - a cyberpunk-themed environment
            for strategic analysis and game simulations. Features multiple themes,
            real-time model interactions, and advanced evaluation tools.
          </Text>
          <Button asChild size="3">
            <Link to="/wargames/challenge">
              Launch Challenge Interface <ArrowRightIcon />
            </Link>
          </Button>
        </Flex>
      </Card>

      <Flex direction="column" gap="4" mb="6">
        <Text as="p">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ac
          diam sit amet quam vehicula elementum sed sit amet dui. Curabitur
          aliquet quam id dui posuere blandit.
        </Text>
        <Text as="p">
          Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vivamus
          magna justo, lacinia eget consectetur sed, convallis at tellus. Sed
          porttitor lectus nibh.
        </Text>
        <Text as="p">
          Nulla quis lorem ut libero malesuada feugiat. Praesent sapien massa,
          convallis a pellentesque nec, egestas non nisi. Vivamus suscipit
          tortor eget felis porttitor volutpat.
        </Text>
        <Text as="p">
          Cras ultricies ligula sed magna dictum porta. Vestibulum ante ipsum
          primis in faucibus orci luctus et ultrices posuere cubilia curae;
          Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet
          ligula.
        </Text>
      </Flex>

      <Heading size="6" mb="4">Protected Content Example</Heading>
      <ProtectedCard>
        <Flex direction="column" gap="3">
          <Heading size="4">Premium Wargames Content</Heading>
          <Text as="p">
            This content is only visible to authenticated users. It contains
            advanced wargaming scenarios and strategic analysis that requires
            user authentication to access.
          </Text>
          <Text as="p">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo.
          </Text>
        </Flex>
      </ProtectedCard>
    </Container>
  );
};

export default WargamesDashboard;
