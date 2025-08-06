import React from "react";
import AuthStatus from "./AuthStatus";
import ThemeSelector from "./ThemeSelector";
import JoinGame from "./JoinGame";
import ToolsPanel from "./ToolsPanel";
import ModeSelector from "./ModeSelector";
import EvalPanel from "./EvalPanel";
import FeedbackPanel from "./FeedbackPanel";

const Options = ({ 
  session,
  theme,
  onThemeChange,
  playerEmail,
  setPlayerEmail,
  showOtpInput,
  otp,
  setOtp,
  joinGameLoading,
  joinGameError,
  setJoinGameError,
  otpMessage,
  handleJoinSession,
  handleOtpVerification,
  setShowOtpInput,
  setOtpMessage,
  onChallengesClick,
  onModeChange,
  onRunEval,
  onViewResults
}) => {
  return (
    <div className="cyber-card">
      <h2 className="text-xl font-semibold text-green-400 mb-6">OPTIONS</h2>
      
      <AuthStatus session={session} />
      
      <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
      
      {/* Only show Join Game component when user is not authenticated */}
      {!session && (
        <JoinGame 
          session={session}
          playerEmail={playerEmail}
          setPlayerEmail={setPlayerEmail}
          showOtpInput={showOtpInput}
          otp={otp}
          setOtp={setOtp}
          joinGameLoading={joinGameLoading}
          joinGameError={joinGameError}
          setJoinGameError={setJoinGameError}
          otpMessage={otpMessage}
          handleJoinSession={handleJoinSession}
          handleOtpVerification={handleOtpVerification}
          setShowOtpInput={setShowOtpInput}
          setOtpMessage={setOtpMessage}
        />
      )}
      
      <ToolsPanel 
        onChallengesClick={onChallengesClick}
      />
      
      <ModeSelector 
        initialMode="single"
        onModeChange={onModeChange}
      />
      
      <EvalPanel 
        onRunEval={onRunEval}
        onViewResults={onViewResults}
      />
      
      <FeedbackPanel />
    </div>
  );
};

export default Options;